# 프로젝트 상태 — 비주얼 취향 분석기

## 현재 단계
- **단계**: v1.0 구현 + UX/UI 개선 + CRITICAL 7건 수정 완료 → Git 커밋 + Vercel 배포 대기
- **코드 품질**: 72/100 (code-analyzer), CRITICAL 7건 수정 완료, WARNING 16건 잔여 (다음 세션)
- **gap-detector**: 78% 매치. CRITICAL 5건 + HIGH 4건 잔여
- **마감**: 없음 (개인 프로젝트)
- **진행률**: 85%

## 최근 완료 (세션99, 03/24)
- [x] PRD v3 작성 — 클로드웹 쇼미 기반 기획 → 7축/남녀/공유/CLI 확장
- [x] 프로젝트 초기화 (Vite + React 19 + TypeScript + Tailwind v4)
- [x] 타입 + 유틸리티 (types/index.ts, grade.ts, chosung.ts, constants.ts)
- [x] 시드 데이터 287명 (여23+남35+DB229) — seed-female/male.json + people-db.json
- [x] Zustand 스토어 + localStorage persist
- [x] 서비스 6개 (analysis, prediction, feedback, search, share)
- [x] 배치 탭 (PC @dnd-kit 드래그 + 모바일 탭→하단바)
- [x] 분석 탭 (레이더 차트 + 가중치 바 + 클러스터 카드 + 공식)
- [x] 예측/피드백/프로파일 탭 + 인물 모달 + 공유 기능
- [x] Owner 프로파일 적용 — R1 배치 26명(S10/A10/B2/C4) + 가중치 + 클러스터 3개
- [x] **UX/UI 전면 개선** — Pretendard 폰트, 이니셜 아바타 칩, 그라데이션 티어 라벨, 하단 네비(아이콘), violet 색상 체계, 소프트 섀도
- [x] **취향 아키타입 시스템** — 42종 아키타입 매핑 ("비주얼 절대주의자" 등), Spotify Wrapped식 리빌 시퀀스
- [x] TypeScript 0에러 + Vite 빌드 통과 (199KB gzipped)

## 다음 할일

### ★★ 1순위: Git 커밋 + Vercel 배포
1. **Git 커밋** — `git add -A && git commit` (git add 훅 차단 이슈 → 사용자가 `! git add -A` 직접 실행 필요)
2. **GitHub 레포 생성** — `gh repo create visual-preference --public --source=. --push`
3. **Vercel 연결** — GitHub 레포 연결 → 자동 배포. vercel.json SPA 리라이트 이미 설정됨

### ★ 2순위: 사용자 리뷰 후 개선
- 직접 사용해보고 피드백 수집 (http://localhost:5180)
- 모바일 실기기 테스트 (터치 드래그, 하단 바, 반응형)
- 분석 리빌 시퀀스 타이밍 조정

### 2.5순위: gap-detector CRITICAL 5건 (배포 전 권장)
- [ ] [인물 추가] 버튼 → PersonModal 연결 (TierBoard.tsx:130, onClick 추가만)
- [ ] Import 확인 대화상자 추가 (ProfileView.tsx, confirm() 래핑)
- [ ] R12 축별 가중치 보정 로직 수정 (feedback.ts, 글로벌→축별)
- [ ] 보정 가중치 → AnalysisResult 반영 (useStore.ts submitFeedback)
- [ ] [전체] 탭 읽기전용 가드 (TierBoard.tsx, genderTab==='ALL' 분기)

### 3순위: gap-detector HIGH 4건 + 미구현
- [ ] S+A < 2 경고 텍스트 표시 (TierBoard.tsx)
- [ ] PointerSensor distance 8→5 (TierBoard.tsx:28)
- [ ] 모바일 [미배치로] 버튼 (MobileTierBar.tsx)
- [ ] name+group 중복 검증 (PersonModal.tsx)
- [ ] 예측 탭: 인물 선택 UI → predictTier 실행 연결
- [ ] CLI 연동 (F08): [CLI용 데이터 복사] + [결과 붙여넣기] UI
- [ ] 인물 DB 확장: axes가 null인 229명에 기본값 채우기 (CLI 또는 수동)
- [ ] 공유 카드 이미지 생성 (html-to-image, 인스타 스토리 포맷)
- [ ] 컨페티 효과 (canvas-confetti)

## 블로커
- **git add 훅 차단**: `block-dangerous.sh`가 .gitignore 내 `.env` 패턴 감지 시 false positive → 사용자가 `! git add -A` 직접 실행 필요
- **인물 사진 없음**: PRD 비목표(텍스트 기반)이지만, 이니셜 아바타로 대체 완료. 추후 사진 추가 시 별도 CDN 필요

## 핵심 참조
```
PRD v3:              C:\Users\jewel\Downloads\PRD_visual_preference_analyzer_v3.md
프로젝트:            C:\Projects\projects\visual-preference\
스토어:              src/store/useStore.ts (Zustand + persist)
Owner 프로파일:      src/data/owner-profile.ts (R1 배치+가중치+클러스터+아키타입)
아키타입 매핑:       src/services/analysis.ts (generateArchetype, 42종)
시드 데이터:         src/data/seed-female.json (23명) + seed-male.json (35명) + people-db.json (229명)
```

## 기술 스택
```
Vite 8 + React 19 + TypeScript 5 + Tailwind v4
@dnd-kit/core + Recharts 3 + Zustand 5 + lz-string
Font: Pretendard Variable (CDN)
Deploy: Vercel (정적, vercel.json SPA 리라이트)
```
