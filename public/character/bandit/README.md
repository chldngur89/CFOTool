# 황건적(도적) 캐릭터 에셋

## 봉 든 황건적 — 두 가지 방법

### 1) 조각 내서 여러 파일로 주기 (지금 방식)
- `rebel_staff_1.png`, `rebel_staff_2.png`: BMP에서 조각 내서 준 2프레임.
- `BanditCharacter variant="rebel_staff"` → 마젠타 투명, 프레임 전환.

### 2) BMP 한 장으로 쓰기 (같은 결과)
- **BMP 한 장**에 프레임을 **세로로 쌓아서** 저장 → `rebel_staff_sheet.bmp` 로 이 폴더에 넣기.
- 예: 1프레임 60×80 이면, 2프레임 = 60×160 이미지 한 장.
- `BanditCharacter variant="rebel_staff_sheet"` 사용하면, 코드가 그 BMP를 **조각 내서** 같은 식으로 재생.
- 현재 코드는 `frameCount: 2`를 기준으로 자동 분할함.
  - 프레임 가로는 BMP 실제 가로를 자동 사용
  - 프레임 세로는 `전체 높이 / frameCount`로 계산
  - 2프레임이 아니면 `BanditCharacter.tsx`의 `REBEL_STAFF_SHEET.frameCount`를 바꾸면 됨

즉, **조각 내서 줄 필요 없이 BMP 한 파일**만 넣어도 됨.

## 다른 종류 추가

- 조각 여러 장: PNG들 넣고 `BanditCharacter`에 새 variant + URL 배열 추가.
- BMP 한 장: 시트 BMP 넣고, 새 variant + `SpriteSheetBmp`(frameWidth, frameHeight, layout) 추가.
