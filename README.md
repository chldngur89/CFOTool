# 대표의 성 방어전 (CFO Tool)

재무 전략 시뮬레이터. 원본 Figma: [Pixel RPG CFO Tool](https://www.figma.com/design/ZoEKtHf8lL4NLYjgHEqKHg/Pixel-RPG-CFO-Tool)

## 서버 띄워서 확인하는 방법

### 1. 의존성 설치 (처음 한 번만)

```bash
cd /Users/wh.choi/Desktop/Code/CFOTool
npm install
```

(pnpm 쓰는 경우: `pnpm install`)

### 2. 개발 서버 실행

```bash
npm run dev
```

실행하면 터미널에 예를 들어 다음처럼 나옵니다:

```
  VITE v6.3.5  ready in 166 ms
  ➜  Local:   http://localhost:5173/
```

**브라우저에서 `http://localhost:5173/` 로 접속**하면 앱을 확인할 수 있습니다.

### 3. (선택) 빌드 검증

배포용 빌드가 정상인지 확인하려면:

```bash
npm run build
```

성공하면 `dist/` 폴더에 결과물이 생성됩니다.

## 스크립트 요약

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 실행 (기본: http://localhost:5173/) |
| `npm run build` | 프로덕션 빌드 → `dist/` |

## AI 전략 추천 (Ollama)

전략 화면의 `AI 추천 Top3 생성`/`AI 최적안 자동 적용`은 Ollama 서버를 호출합니다.

선택 환경변수:

```bash
VITE_OLLAMA_BASE_URL=http://localhost:11434
VITE_OLLAMA_MODEL=llama3.1:latest
```

설정이 없으면 기본값(`http://localhost:11434`, `llama3.1:latest`)을 사용합니다.
