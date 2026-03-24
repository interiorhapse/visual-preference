// 사용자 프로파일 (그라운드 트루스) — 송제성
// R1 배치 39명 + 확정 가중치 + 클러스터

import type { Tier, Archetype, Cluster } from '../types'
import { generateArchetype } from '../services/analysis'

// R1 배치: 인물명 → 티어 (성별 전부 F)
export const OWNER_PLACEMENTS: Record<string, Tier> = {
  // S (10명)
  '송하영': 'S',
  '이채령': 'S',
  '카리나': 'S',
  '김민주': 'S',
  '연우': 'S',
  '채원': 'S',
  '나나': 'S',
  '유빈': 'S',
  '설윤': 'S',
  '하니': 'S',
  // A (10명)
  '쥴리': 'A',
  '이나경': 'A',
  '아이린': 'A',
  '아린': 'A',
  '김유연': 'A',
  '장원영': 'A',
  '이해리': 'A',
  '슈화': 'A',
  '전지현': 'A',
  // 조유리 — people-db에서 찾아야 함
  // B (2명)
  // 박보영, 츄 — people-db에서 찾아야 함
  // C (4명)
  '아이유': 'C',
  // 한지민, 강민경, 윈터 — people-db에서 찾아야 함
}

// DB에서 이름으로 찾아야 하는 추가 인물 (시드에 없을 수 있음)
export const OWNER_EXTRA_PLACEMENTS: Record<string, { tier: Tier; group: string }> = {
  '조유리': { tier: 'A', group: 'IZ*ONE' },
  '박보영': { tier: 'B', group: '배우' },
  '츄': { tier: 'B', group: 'Lovelyz' },
  '한지민': { tier: 'C', group: '배우' },
  '강민경': { tier: 'C', group: '다비치' },
  '윈터': { tier: 'C', group: 'aespa' },
}

// 확정 가중치 (피드백 보정 반영 최종)
export const OWNER_WEIGHTS: Record<string, number> = {
  face: 25,
  bodyType: 20,
  skinTone: 15,
  vibe: 0,  // v2에서는 없었음, 7축 체계에서 재산정 필요
  performance: 15,
  personality: 15,
  skill: 10,
}

// 7축 체계 재산정 가중치 (vibe 포함)
export const OWNER_WEIGHTS_7AXIS: Record<string, number> = {
  face: 22,
  bodyType: 17,
  skinTone: 13,
  vibe: 10,
  performance: 14,
  personality: 14,
  skill: 10,
}

// S 티어 클러스터
export const OWNER_CLUSTERS: Cluster[] = [
  {
    name: '비주얼 총합형',
    memberIds: [], // 런타임에 채움
    dominantAxes: ['face', 'bodyType', 'skinTone'],
  },
  {
    name: '소프트 밸런스형',
    memberIds: [],
    dominantAxes: ['face', 'skinTone', 'personality'],
  },
  {
    name: '퍼포먼스 보정형',
    memberIds: [],
    dominantAxes: ['performance', 'skill'],
  },
]

// 클러스터 멤버 매핑 (이름 기반, 런타임에 ID로 변환)
export const CLUSTER_MEMBERS: Record<string, string[]> = {
  '비주얼 총합형': ['카리나', '김민주', '연우', '나나'],
  '소프트 밸런스형': ['송하영', '설윤', '채원', '하니'],
  '퍼포먼스 보정형': ['이채령', '유빈'],
}

// 취향 공식
export const OWNER_FORMULA = '"전부 괜찮아야 하는 사람" — 얼굴 + 체형 + 피부톤 총합 중심, 성격이 극복 변수'

// 아키타입 (가중치 기반 자동 생성)
export const OWNER_ARCHETYPE: Archetype = generateArchetype(OWNER_WEIGHTS_7AXIS)

// 핵심 인물 포지션
export const KEY_POSITIONS = {
  allTime1st: '송하영',
  facePeak: ['김민주', '연우'],
  balanceS: '이채령',
}
