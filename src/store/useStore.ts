import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Person,
  TierSession,
  TierPlacement,
  Prediction,
  AnalysisResult,
  WeightHistory,
  Gender,
  GenderTab,
  FunctionTab,
  Tier,
  AppData,
} from '../types'
import { SCHEMA_VERSION } from '../utils/constants'
import { analyzePreferences } from '../services/analysis'
import {
  OWNER_PLACEMENTS,
  OWNER_EXTRA_PLACEMENTS,
  OWNER_WEIGHTS_7AXIS,
  OWNER_CLUSTERS,
  CLUSTER_MEMBERS,
  OWNER_FORMULA,
  OWNER_ARCHETYPE,
} from '../data/owner-profile'
import { predictTier as predictTierService } from '../services/prediction'
import { processFeedback, adjustWeights } from '../services/feedback'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StoreState {
  // Data
  persons: Person[]
  sessions: TierSession[]
  placements: TierPlacement[]
  predictions: Prediction[]
  analysisResults: AnalysisResult[]
  weightHistory: WeightHistory[]
  initialized: boolean

  // UI state
  genderTab: GenderTab
  functionTab: FunctionTab
  selectedPersonId: string | null
  currentSessionId: Record<Gender, string | null>
}

interface StoreActions {
  // Initialization
  initializeData: () => void

  // UI
  setGenderTab: (tab: GenderTab) => void
  setFunctionTab: (tab: FunctionTab) => void
  setSelectedPersonId: (id: string | null) => void

  // Person CRUD
  addPerson: (person: Omit<Person, 'id' | 'createdAt' | 'updatedAt'>) => Person
  updatePerson: (id: string, updates: Partial<Omit<Person, 'id' | 'createdAt'>>) => void
  deletePerson: (id: string) => void

  // Tier placement
  placePerson: (personId: string, tier: Tier) => void
  removePlacement: (personId: string) => void

  // Derived
  getPlacementsByGender: (gender: Gender) => TierPlacement[]

  // Analysis & prediction
  runAnalysis: (gender: Gender) => AnalysisResult | null
  predictTier: (personId: string) => Prediction | null
  submitFeedback: (predictionId: string, actualTier: Tier) => void
  getCurrentAnalysis: (gender: Gender) => AnalysisResult | null

  // Import/export
  exportData: () => AppData
  importData: (data: AppData) => void
}

type Store = StoreState & StoreActions

// ---------------------------------------------------------------------------
// Seed data loader
// ---------------------------------------------------------------------------

let initPromise: Promise<void> | null = null

type SeedEntry = {
  id: string
  name: string
  group: string
  gender: Gender
  tag: Person['tag']
  axes: Person['axes'] | null
}

async function fetchSeedData(): Promise<Person[]> {
  const now = new Date().toISOString()
  const [femaleModule, maleModule, dbModule] = await Promise.all([
    import('../data/seed-female.json'),
    import('../data/seed-male.json'),
    import('../data/people-db.json'),
  ])

  const allRaw: SeedEntry[] = [
    ...(femaleModule.default as SeedEntry[]),
    ...(maleModule.default as SeedEntry[]),
    ...(dbModule.default as SeedEntry[]),
  ]

  return allRaw.map((s) => ({
    id: s.id,
    name: s.name,
    group: s.group,
    gender: s.gender as Gender,
    tag: (s.tag || '기존') as Person['tag'],
    axes: s.axes ?? {
      face: null, bodyType: null, skinTone: null, vibe: null,
      performance: null, personality: null, skill: null,
    },
    note: null,
    createdAt: now,
    updatedAt: now,
  }))
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------


export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      // Initial state
      persons: [],
      sessions: [],
      placements: [],
      predictions: [],
      analysisResults: [],
      weightHistory: [],
      initialized: false,

      genderTab: 'F',
      functionTab: 'placement',
      selectedPersonId: null,
      currentSessionId: { M: null, F: null },

      // -----------------------------------------------------------------------
      // Initialization
      // -----------------------------------------------------------------------
      initializeData: () => {
        const state = get()
        if (state.initialized || initPromise) return

        initPromise = fetchSeedData().then((seedPersons) => {
          const now = new Date().toISOString()

          // Create initial sessions for each gender
          const femaleSession: TierSession = {
            id: crypto.randomUUID(),
            name: '기본 세션',
            gender: 'F',
            createdAt: now,
          }
          const maleSession: TierSession = {
            id: crypto.randomUUID(),
            name: '기본 세션',
            gender: 'M',
            createdAt: now,
          }

          // --- Apply owner profile placements ---
          const ownerPlacements: TierPlacement[] = []

          // Add extra persons not in seed (조유리, 박보영, 츄, 한지민, 강민경, 윈터)
          const extraPersons: Person[] = []
          for (const [name, info] of Object.entries(OWNER_EXTRA_PLACEMENTS)) {
            const existing = seedPersons.find((p) => p.name === name)
            if (!existing) {
              const ep: Person = {
                id: crypto.randomUUID(),
                name,
                group: info.group,
                gender: 'F',
                tag: '추가',
                axes: { face: null, bodyType: null, skinTone: null, vibe: null, performance: null, personality: null, skill: null },
                note: null,
                createdAt: now,
                updatedAt: now,
              }
              extraPersons.push(ep)
            }
          }

          const allPersons = [...seedPersons, ...extraPersons]

          // Create placements from OWNER_PLACEMENTS
          const allOwnerPlacements = { ...OWNER_PLACEMENTS }
          for (const [name, info] of Object.entries(OWNER_EXTRA_PLACEMENTS)) {
            allOwnerPlacements[name] = info.tier
          }

          const orderCounters: Record<string, number> = { S: 0, A: 0, B: 0, C: 0 }
          for (const [name, tier] of Object.entries(allOwnerPlacements)) {
            const person = allPersons.find((p) => p.name === name && p.gender === 'F')
            if (person) {
              ownerPlacements.push({
                id: crypto.randomUUID(),
                sessionId: femaleSession.id,
                personId: person.id,
                tier,
                orderInTier: orderCounters[tier]++,
                placedAt: now,
              })
            }
          }

          // Create owner analysis result with ground truth clusters
          const ownerClusters = OWNER_CLUSTERS.map((c) => {
            const memberNames = CLUSTER_MEMBERS[c.name] || []
            const memberIds = memberNames
              .map((n) => allPersons.find((p) => p.name === n)?.id)
              .filter((id): id is string => !!id)
            return { ...c, memberIds }
          })

          const ownerAnalysis: AnalysisResult = {
            id: crypto.randomUUID(),
            sessionId: femaleSession.id,
            gender: 'F',
            axisWeights: OWNER_WEIGHTS_7AXIS,
            clusters: ownerClusters,
            formulaSummary: OWNER_FORMULA,
            archetype: OWNER_ARCHETYPE,
            mustHaveAxes: ['skinTone', 'bodyType'],
            radarData: {
              sTier: [82, 84, 92, 82, 80, 82, 76],  // S tier averages
              cTier: [72, 58, 76, 68, 55, 62, 72],  // C tier averages
            },
            createdAt: now,
          }

          set({
            persons: allPersons,
            sessions: [femaleSession, maleSession],
            placements: ownerPlacements,
            analysisResults: [ownerAnalysis],
            currentSessionId: {
              F: femaleSession.id,
              M: maleSession.id,
            },
            initialized: true,
          })
        })
      },

      // -----------------------------------------------------------------------
      // UI actions
      // -----------------------------------------------------------------------
      setGenderTab: (tab) => set({ genderTab: tab }),
      setFunctionTab: (tab) => set({ functionTab: tab }),
      setSelectedPersonId: (id) => set({ selectedPersonId: id }),

      // -----------------------------------------------------------------------
      // Person CRUD
      // -----------------------------------------------------------------------
      addPerson: (personData) => {
        const now = new Date().toISOString()
        const person: Person = {
          ...personData,
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
        }
        set((state) => ({ persons: [...state.persons, person] }))
        return person
      },

      updatePerson: (id, updates) => {
        set((state) => ({
          persons: state.persons.map((p) =>
            p.id === id
              ? { ...p, ...updates, updatedAt: new Date().toISOString() }
              : p,
          ),
        }))
      },

      deletePerson: (id) => {
        set((state) => ({
          persons: state.persons.filter((p) => p.id !== id),
          // Cascade: remove placements
          placements: state.placements.filter((p) => p.personId !== id),
          // Cascade: remove predictions
          predictions: state.predictions.filter((p) => p.personId !== id),
        }))
      },

      // -----------------------------------------------------------------------
      // Tier placement
      // -----------------------------------------------------------------------
      placePerson: (personId, tier) => {
        const state = get()
        const person = state.persons.find((p) => p.id === personId)
        if (!person) return

        const sessionId = state.currentSessionId[person.gender]
        if (!sessionId) return

        // Check if already placed in this session
        const existing = state.placements.find(
          (p) => p.personId === personId && p.sessionId === sessionId,
        )

        if (existing) {
          // Update tier
          set((s) => ({
            placements: s.placements.map((p) =>
              p.id === existing.id
                ? { ...p, tier, placedAt: new Date().toISOString() }
                : p,
            ),
          }))
        } else {
          // Count existing placements in this tier for ordering
          const orderInTier = state.placements.filter(
            (p) => p.sessionId === sessionId && p.tier === tier,
          ).length

          const placement: TierPlacement = {
            id: crypto.randomUUID(),
            sessionId,
            personId,
            tier,
            orderInTier,
            placedAt: new Date().toISOString(),
          }
          set((s) => ({ placements: [...s.placements, placement] }))
        }
      },

      removePlacement: (personId) => {
        const state = get()
        const person = state.persons.find((p) => p.id === personId)
        if (!person) return

        const sessionId = state.currentSessionId[person.gender]
        if (!sessionId) return

        set((s) => ({
          placements: s.placements.filter(
            (p) => !(p.personId === personId && p.sessionId === sessionId),
          ),
        }))
      },

      // -----------------------------------------------------------------------
      // Derived getters
      // -----------------------------------------------------------------------
      getPlacementsByGender: (gender) => {
        const state = get()
        const sessionId = state.currentSessionId[gender]
        if (!sessionId) return []
        return state.placements.filter((p) => p.sessionId === sessionId)
      },

      // -----------------------------------------------------------------------
      // Analysis & prediction
      // -----------------------------------------------------------------------
      runAnalysis: (gender) => {
        const state = get()
        const sessionId = state.currentSessionId[gender]
        if (!sessionId) return null

        const sessionPlacements = state.placements.filter(
          (p) => p.sessionId === sessionId,
        )
        const genderPersons = state.persons.filter((p) => p.gender === gender)

        const result = analyzePreferences(genderPersons, sessionPlacements)
        // Ensure correct session/gender
        const finalResult: AnalysisResult = {
          ...result,
          sessionId,
          gender,
        }

        set((s) => ({
          analysisResults: [...s.analysisResults, finalResult],
        }))

        return finalResult
      },

      predictTier: (personId) => {
        const state = get()
        const person = state.persons.find((p) => p.id === personId)
        if (!person) return null

        const sessionId = state.currentSessionId[person.gender]
        if (!sessionId) return null

        // Get latest analysis weights for this gender
        const latestAnalysis = [...state.analysisResults]
          .filter((a) => a.gender === person.gender)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]

        if (!latestAnalysis) return null

        const placementCount = state.placements.filter(
          (p) => p.sessionId === sessionId,
        ).length

        const prediction = predictTierService(
          person,
          latestAnalysis.axisWeights,
          placementCount,
          sessionId,
        )

        set((s) => ({
          predictions: [...s.predictions, prediction],
        }))

        return prediction
      },

      submitFeedback: (predictionId, actualTier) => {
        const state = get()
        const prediction = state.predictions.find((p) => p.id === predictionId)
        if (!prediction) return

        const { updatedPrediction, shouldAdjust } = processFeedback(
          prediction,
          actualTier,
        )

        // Update the prediction in store
        set((s) => ({
          predictions: s.predictions.map((p) =>
            p.id === predictionId ? updatedPrediction : p,
          ),
        }))

        // Check if we should adjust weights
        if (shouldAdjust) {
          const sessionPredictions = get().predictions.filter(
            (p) => p.sessionId === prediction.sessionId,
          )

          const latestAnalysis = [...get().analysisResults]
            .filter((a) => a.sessionId === prediction.sessionId)
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]

          if (latestAnalysis) {
            const result = adjustWeights(
              latestAnalysis.axisWeights,
              sessionPredictions,
              prediction.sessionId,
            )

            if (result) {
              set((s) => ({
                weightHistory: [...s.weightHistory, result.history],
                // #4: Persist adjusted weights to AnalysisResult
                analysisResults: s.analysisResults.map((a) =>
                  a.id === latestAnalysis.id
                    ? { ...a, axisWeights: result.newWeights }
                    : a,
                ),
              }))
            }
          }
        }
      },

      getCurrentAnalysis: (gender) => {
        const state = get()
        const sessionId = state.currentSessionId[gender]
        if (!sessionId) return null

        return [...state.analysisResults]
          .filter((a) => a.gender === gender && a.sessionId === sessionId)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null
      },

      // -----------------------------------------------------------------------
      // Import / Export
      // -----------------------------------------------------------------------
      exportData: () => {
        const state = get()
        return {
          schemaVersion: SCHEMA_VERSION as 2,
          persons: state.persons,
          sessions: state.sessions,
          placements: state.placements,
          predictions: state.predictions,
          analysisResults: state.analysisResults,
          weightHistory: state.weightHistory,
        }
      },

      importData: (data) => {
        // Schema version check
        if (data.schemaVersion !== SCHEMA_VERSION) {
          console.warn(`Schema version mismatch: expected ${SCHEMA_VERSION}, got ${data.schemaVersion}`)
          return
        }
        // Structural validation
        if (!Array.isArray(data.persons) || !Array.isArray(data.sessions) ||
            !Array.isArray(data.placements) || !Array.isArray(data.predictions) ||
            !Array.isArray(data.analysisResults) || !Array.isArray(data.weightHistory)) {
          console.warn('Invalid data structure: expected arrays')
          return
        }
        // Validate person shape (spot check first item)
        if (data.persons.length > 0) {
          const p = data.persons[0]
          if (typeof p.id !== 'string' || typeof p.name !== 'string' || typeof p.gender !== 'string') {
            console.warn('Invalid person data structure')
            return
          }
        }

        set({
          persons: data.persons,
          sessions: data.sessions,
          placements: data.placements,
          predictions: data.predictions,
          analysisResults: data.analysisResults,
          weightHistory: data.weightHistory,
          initialized: true,
        })
      },
    }),
    {
      name: 'visual-preference-data',
      partialize: (state) => ({
        persons: state.persons,
        sessions: state.sessions,
        placements: state.placements,
        predictions: state.predictions,
        analysisResults: state.analysisResults,
        weightHistory: state.weightHistory,
        initialized: state.initialized,
        currentSessionId: state.currentSessionId,
      }),
    },
  ),
)

// Dev helper — stripped in production builds
if (import.meta.env.DEV && typeof window !== 'undefined') {
  ;(window as unknown as Record<string, unknown>).__store = useStore
}
