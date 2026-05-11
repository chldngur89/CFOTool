# HANDOFF

새 컴퓨터에서 이 프로젝트를 다시 이어받기 위한 문서입니다.

## 1. 현재 상태 요약

### 끝난 것

- 삼국지 풍 메인 UI와 재무 시뮬레이션 흐름 완성
- 금고/비용 수정 팝업 연결
- 인건비 `직원 수 x 300만원` 규칙 적용
- 시나리오 선택 -> 전략 조정 -> 시뮬레이션 흐름 연결
- 로컬 Ollama 호출 연결
- 배포 환경 fallback AI 처리
- Supabase 저장 계층 코드 추가
- Supabase 실패 시 게스트 모드 fallback 처리

### 아직 안 끝난 것

- 실제 Supabase URL 확정 및 인증/저장 실검증
- 배포 환경에서 실제 Ollama를 쓸지, fallback만 유지할지 최종 결정
- 저장 슬롯 2개 이상일 때 workspace 선택 UI
- 월간 입력 UX 정리
- 문서/테스트 보강

## 2. 지금 바로 해야 할 일

우선순위 순서입니다.

### 1. Supabase URL 다시 확인

가장 먼저 할 일입니다.

Supabase 대시보드에서 아래를 다시 복사해야 합니다.

- `Project Settings`
- `API`
- `Project URL`

검증:

```bash
curl -I https://YOUR_PROJECT.supabase.co/auth/v1/health
```

이게 성공해야 로그인/저장 검증을 이어갈 수 있습니다.

### 2. 새 컴퓨터에 프로젝트 복구

```bash
git clone <repo-url>
cd CFOTool
npm install
```

### 3. `.env.local` 다시 세팅

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
VITE_OLLAMA_BASE_URL=http://localhost:11434
VITE_OLLAMA_MODEL=llama3.1:latest
```

배포에서 원격 Ollama까지 쓸 경우:

```bash
VITE_ENABLE_REMOTE_OLLAMA=true
VITE_OLLAMA_BASE_URL=https://YOUR-PUBLIC-OLLAMA-URL
```

## 3. 새 컴퓨터에서 확인할 순서

### 로컬 확인

```bash
npm run dev
```

확인 항목:

1. 첫 화면이 바로 뜨는지
2. 금고/인건비/마케팅비/사무실비 팝업이 열리는지
3. 시나리오 선택 -> 전략 조정 -> 시뮬레이션이 이어지는지
4. 로컬에서는 Ollama가 실제 호출되는지

### 빌드 확인

```bash
npm run build
```

### 배포 확인

배포 후 확인 항목:

1. `localhost:11434` 호출이 콘솔/네트워크에 없는지
2. fallback 참모 문구가 정상적으로 뜨는지
3. Supabase URL이 정상이라면 로그인/저장이 되는지

## 4. 실제 DB 저장 검증 순서

Supabase URL이 정상일 때 아래 순서로 검증합니다.

1. 회원가입 또는 로그인
2. `cfo.cfo_profiles` row 생성 확인
3. 금고 또는 비용 수정
4. `cfo.cfo_metric_snapshots` upsert 확인
5. 시뮬레이션 실행
6. `cfo.cfo_simulation_runs` insert 확인
7. 전략 추천 실행
8. `cfo.cfo_ai_briefs` insert 확인
9. 추천안 반영
10. `cfo.cfo_ai_action_logs` insert 확인

## 5. 남은 작업 목록

### High

- [ ] Supabase 실제 로그인/저장 검증 완료
- [ ] 잘못된 Supabase URL을 운영 환경변수에서 제거하고 정상 URL로 교체
- [ ] workspace 여러 개를 선택하는 UI 추가
- [ ] 시뮬레이션/스냅샷 복원 UX 보강

### Medium

- [ ] 배포 환경에서 실제 Ollama를 쓸지 정책 확정
- [ ] 원격 Ollama 공개 URL 안정화
- [ ] 회원가입/로그인 흐름 UX 다듬기
- [ ] 최근 6개월 기록과 실제 저장 데이터 연결 검증 강화
- [ ] 월간 입력 폼 분리

### Low

- [ ] 번들 사이즈 줄이기
- [ ] 재무 계산 테스트 추가
- [ ] README와 HANDOFF의 운영 절차 주기적 갱신

## 6. 관련 핵심 파일

- `/Users/wh.choi/Desktop/Code/CFOTool/src/app/App.tsx`
- `/Users/wh.choi/Desktop/Code/CFOTool/src/app/components/CastleDefense.tsx`
- `/Users/wh.choi/Desktop/Code/CFOTool/src/app/components/MainDashboard.tsx`
- `/Users/wh.choi/Desktop/Code/CFOTool/src/app/components/StrategyPanel.tsx`
- `/Users/wh.choi/Desktop/Code/CFOTool/src/app/lib/supabase.ts`
- `/Users/wh.choi/Desktop/Code/CFOTool/src/app/lib/cfoProfile.ts`
- `/Users/wh.choi/Desktop/Code/CFOTool/src/app/lib/cfoStorage.ts`
- `/Users/wh.choi/Desktop/Code/CFOTool/src/app/lib/aiStrategyAdvisor.ts`

## 7. 한 줄 결론

지금 프로젝트는 `UI/시뮬레이션/로컬 AI/fallback 구조`까지는 정리됐고,  
남은 핵심은 `정확한 Supabase URL로 실제 저장 검증 마무리`입니다.
