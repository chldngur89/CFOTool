#!/usr/bin/env python3
"""
BMP 스프라이트 시트 또는 여러 BMP 프레임을 하나의 GIF로 변환.
- 마젠타 배경(255, 0, 255)을 투명하게 처리.
- 단일 스프라이트: 세로로 쌓인 프레임을 frame_width x frame_height 로 잘라서 GIF 생성.
- 여러 파일: 각 BMP를 한 프레임으로 합쳐서 GIF 생성.
"""
from PIL import Image
import argparse
import os


def make_magenta_transparent(frame: Image.Image) -> Image.Image:
    """마젠타(핑크) 배경을 투명하게. RGBA 모드 필요."""
    frame = frame.convert("RGBA")
    datas = frame.getdata()
    new_data = []
    for item in datas:
        r, g, b, a = item
        # 핑크색 배경 감지 (약간의 오차 허용)
        if r > 200 and g < 50 and b > 200:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
    frame.putdata(list(new_data))
    return frame


def create_gif_from_sprite_sheet(
    input_path: str,
    output_path: str,
    frame_width: int,
    frame_height: int,
    duration: int = 100,
) -> None:
    """세로로 나열된 스프라이트 시트 BMP → GIF."""
    sprite_sheet = Image.open(input_path).convert("RGBA")
    sheet_width, sheet_height = sprite_sheet.size
    frames = []

    for y in range(0, sheet_height, frame_height):
        if y + frame_height > sheet_height:
            break
        box = (0, y, frame_width, y + frame_height)
        frame = sprite_sheet.crop(box)
        frame = make_magenta_transparent(frame)
        frames.append(frame)

    if frames:
        frames[0].save(
            output_path,
            save_all=True,
            append_images=frames[1:],
            optimize=False,
            duration=duration,
            loop=0,
            disposal=2,
        )
        print(f"GIF 생성 완료 (스프라이트): {output_path} ({len(frames)}프레임)")


def create_gif_from_files(
    input_paths: list[str],
    output_path: str,
    duration: int = 100,
) -> None:
    """여러 BMP 파일을 순서대로 한 프레임씩 합쳐서 GIF 생성."""
    frames = []
    for path in input_paths:
        if not os.path.isfile(path):
            print(f"경고: 파일 없음 - {path}")
            continue
        frame = Image.open(path).convert("RGBA")
        frame = make_magenta_transparent(frame)
        frames.append(frame)

    if not frames:
        print("오류: 유효한 프레임이 없습니다.")
        return

    frames[0].save(
        output_path,
        save_all=True,
        append_images=frames[1:],
        optimize=False,
        duration=duration,
        loop=0,
        disposal=2,
    )
    print(f"GIF 생성 완료 (다중 파일): {output_path} ({len(frames)}프레임)")


def main():
    parser = argparse.ArgumentParser(description="BMP → GIF (마젠타 투명)")
    sub = parser.add_subparsers(dest="mode", required=True)

    # 모드 1: 단일 스프라이트 시트
    p_sprite = sub.add_parser("sprite", help="세로 스프라이트 시트 하나 → GIF")
    p_sprite.add_argument("input", help="BMP 스프라이트 시트 경로")
    p_sprite.add_argument("-o", "--output", required=True, help="출력 GIF 경로")
    p_sprite.add_argument("--width", type=int, required=True, help="프레임 가로 px")
    p_sprite.add_argument("--height", type=int, required=True, help="프레임 세로 px")
    p_sprite.add_argument("-d", "--duration", type=int, default=100, help="프레임당 ms")

    # 모드 2: 여러 BMP 파일 → 한 GIF
    p_files = sub.add_parser("files", help="여러 BMP 파일 → 한 GIF")
    p_files.add_argument("inputs", nargs="+", help="BMP 파일 경로들 (순서대로 프레임)")
    p_files.add_argument("-o", "--output", required=True, help="출력 GIF 경로")
    p_files.add_argument("-d", "--duration", type=int, default=100, help="프레임당 ms")

    args = parser.parse_args()

    if args.mode == "sprite":
        create_gif_from_sprite_sheet(
            args.input,
            args.output,
            args.width,
            args.height,
            args.duration,
        )
    else:
        create_gif_from_files(args.inputs, args.output, args.duration)


if __name__ == "__main__":
    main()
