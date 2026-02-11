# BMP → GIF 변환 스크립트

캐릭터 BMP를 **마젠타 배경 투명** 처리한 **GIF 애니메이션**으로 만듭니다.

## 준비

```bash
# 프로젝트 루트에서
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install Pillow
```

## 사용법

### 1) 여러 BMP 파일 → 한 GIF (현재 캐릭터용)

```bash
.venv/bin/python3 scripts/create_gif_from_sprite.py files \
  public/character/strategist/atk.bmp \
  public/character/strategist/mov.bmp \
  public/character/strategist/spc.bmp \
  -o public/character/strategist/anim.gif \
  -d 120
```

- `-d 120`: 프레임당 120ms
- 책사/장군/도적 각각 위처럼 한 번씩 실행하면 `anim.gif` 생성

### 2) 스프라이트 시트 하나 → GIF

세로로 쌓인 한 장의 BMP를 잘라서 GIF로 만들 때:

```bash
.venv/bin/python3 scripts/create_gif_from_sprite.py sprite x.bmp -o out.gif --width 60 --height 80 -d 100
```

## 한 번에 전부 생성

```bash
.venv/bin/python3 scripts/create_gif_from_sprite.py files public/character/strategist/atk.bmp public/character/strategist/mov.bmp public/character/strategist/spc.bmp -o public/character/strategist/anim.gif -d 120
.venv/bin/python3 scripts/create_gif_from_sprite.py files public/character/general/x.bmp public/character/general/Y.bmp -o public/character/general/anim.gif -d 150
.venv/bin/python3 scripts/create_gif_from_sprite.py files public/character/bandit/atk.bmp public/character/bandit/mov.bmp public/character/bandit/spc.bmp -o public/character/bandit/anim.gif -d 100
```

생성된 `anim.gif`는 화면에서 바로 사용됩니다 (투명 배경 + 반복 재생).
