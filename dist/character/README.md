# 캐릭터 BMP 적용 방법 (조각조각 모션)

BMP **한 장**을 넣으면, **한 프레임 크기**대로 잘라서 모션으로 씁니다.

## 적용하려면 알려줘야 할 것 (3가지)

1. **한 프레임 가로(px)**  
   예: `60`
2. **한 프레임 세로(px)**  
   예: `80`
3. **배치**  
   - **세로로 쌓임** (`vertical`)  
     - 조조전처럼 한 캐릭터 모션이 위에서 아래로 쌓인 경우  
     - 예: 이미지 크기 60 x 240 → 3프레임 (80+80+80)
   - **가로로 나열** (`horizontal`)  
     - 한 줄에 모션이 왼쪽에서 오른쪽으로 나열된 경우

## BMP 넣는 위치

- **대표 책사**: `strategist/atk.bmp` (한 장에 모션 전부 세로로 쌓기)
- **대표 장군**: `general/x.bmp` (한 장에 모션 전부 세로로 쌓기)
- **도적**: `bandit/atk.bmp` (한 장에 모션 전부 세로로 쌓기)

한 장에 **여러 프레임**이 들어가 있어야 조각이 여러 개로 나와서 움직입니다.  
한 프레임만 있으면(이미지가 60x80 한 칸이면) 한 장만 보이고 멈춰 있습니다.

## 코드에서 숫자 바꾸는 곳

- **대표**: `src/app/components/character/RepresentativeCharacter.tsx`  
  - `SLICE_SPEC.frameWidth`, `frameHeight`, `layout`
- **도적**: `src/app/components/character/BanditCharacter.tsx`  
  - `SLICE_SPEC.frameWidth`, `frameHeight`, `layout`

지금 기본값은 **가로 60px, 세로 80px, 세로로 쌓임(vertical)** 입니다.  
실제 BMP 크기에 맞게 위 숫자만 바꿔주면 됩니다.
