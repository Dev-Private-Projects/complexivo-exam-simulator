import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { getQuestions } from '@/services/question.service'
import type { Question } from '@/types/question'
import type { SimulatorPhase } from '@/types/simulador'
import { QUESTION_COUNT, TIME_LIMIT_SECONDS } from '@/constants/simulador'

export const useSimuladorStore = defineStore('simulador', () => {
  const phase = ref<SimulatorPhase>('briefing')
  const questions = ref<Question[]>([])
  const selectedByQuestion = ref<Record<number, number>>({})
  const currentIndex = ref(0)
  const remainingSeconds = ref(TIME_LIMIT_SECONDS)
  const loadingQuestions = ref(false)
  const loadError = ref<string | null>(null)

  let timerId: ReturnType<typeof setInterval> | null = null

  const formattedTime = computed(() => {
    const minutes = Math.max(0, Math.floor(remainingSeconds.value / 60))
    const seconds = Math.max(0, remainingSeconds.value % 60)
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  })

  const currentQuestion = computed(() => questions.value[currentIndex.value])
  const total = computed(() => questions.value.length)

  const correctCount = computed(() =>
    questions.value.reduce((count, q) => {
      const selected = selectedByQuestion.value[q.id]
      if (selected === undefined) return count
      const option = q.options.find((o) => o.id === selected)
      return option?.isCorrect ? count + 1 : count
    }, 0),
  )
  const answeredCount = computed(() => Object.keys(selectedByQuestion.value).length)
  const successRatio = computed(() => (total.value === 0 ? 0 : correctCount.value / total.value))

  const byCategory = computed(() => {
    const map = new Map<string, { total: number; correct: number; incorrect: number; unanswered: number }>()
    for (const q of questions.value) {
      const key = q.category.name
      const entry = map.get(key) ?? { total: 0, correct: 0, incorrect: 0, unanswered: 0 }
      entry.total++
      const selected = selectedByQuestion.value[q.id]
      if (selected === undefined) {
        entry.unanswered++
      } else {
        const option = q.options.find((o) => o.id === selected)
        if (option?.isCorrect) {
          entry.correct++
        } else {
          entry.incorrect++
        }
      }
      map.set(key, entry)
    }
    return [...map.entries()].map(([name, v]) => ({
      name,
      total: v.total,
      correct: v.correct,
      incorrect: v.incorrect,
      unanswered: v.unanswered,
      ratio: v.total === 0 ? 0 : v.correct / v.total,
    }))
  })

  const pickProportional = (all: Question[], count: number): Question[] => {
    const groups = new Map<string, Question[]>()
    for (const q of all) {
      const list = groups.get(q.category.name) ?? []
      list.push(q)
      groups.set(q.category.name, list)
    }

    const totalQuestions = all.length
    const entries = [...groups.entries()].map(([name, arr]) => ({
      name,
      arr: [...arr].sort(() => Math.random() - 0.5),
      available: arr.length,
      exact: (count * arr.length) / totalQuestions,
    }))

    const counts = new Map<string, number>()
    for (const e of entries) {
      counts.set(e.name, Math.min(e.available, Math.max(1, Math.floor(e.exact))))
    }

    const remainders = entries.map((e) => ({
      name: e.name,
      available: e.available,
      rem: e.exact - Math.floor(e.exact),
    }))

    let diff = count - [...counts.values()].reduce((a, b) => a + b, 0)
    while (diff > 0) {
      let best = -1
      let bestRem = -1
      for (let i = 0; i < remainders.length; i++) {
        const r = remainders[i]!
        const current = counts.get(r.name)!
        if (current < r.available && r.rem > bestRem) {
          bestRem = r.rem
          best = i
        }
      }
      if (best === -1) break
      const target = remainders[best]!
      counts.set(target.name, counts.get(target.name)! + 1)
      target.rem = -1
      diff--
    }
    while (diff < 0) {
      let best = -1
      let bestCount = 1
      for (let i = 0; i < remainders.length; i++) {
        const r = remainders[i]!
        const current = counts.get(r.name)!
        if (current > 1 && current > bestCount) {
          bestCount = current
          best = i
        }
      }
      if (best === -1) break
      const target = remainders[best]!
      counts.set(target.name, counts.get(target.name)! - 1)
      diff++
    }

    const picked: Question[] = []
    for (const e of entries) {
      picked.push(...e.arr.slice(0, counts.get(e.name)!))
    }
    return picked.sort(() => Math.random() - 0.5)
  }

  const stopTimer = () => {
    if (timerId) {
      clearInterval(timerId)
      timerId = null
    }
  }

  const onKeyPress = () => {
    if (phase.value === 'exam') {
      finalize()
    }
  }

  const onVisibilityChange = () => {
    if (document.hidden && phase.value === 'exam') {
      finalize()
    }
  }

  const startTimer = () => {
    stopTimer()
    timerId = setInterval(() => {
      if (remainingSeconds.value <= 1) {
        remainingSeconds.value = 0
        finalize()
        return
      }
      remainingSeconds.value--
    }, 1000)
  }

  const startExam = async () => {
    loadingQuestions.value = true
    loadError.value = null
    try {
      const all = await getQuestions([], '')
      questions.value = pickProportional(all, QUESTION_COUNT)
      selectedByQuestion.value = {}
      currentIndex.value = 0
      remainingSeconds.value = TIME_LIMIT_SECONDS
      phase.value = 'exam'
      startTimer()
      window.addEventListener('keydown', onKeyPress)
      document.addEventListener('visibilitychange', onVisibilityChange)
    } catch (error) {
      loadError.value = error instanceof Error ? error.message : 'Error al cargar las preguntas'
    } finally {
      loadingQuestions.value = false
    }
  }

  const answer = (optionId: number) => {
    if (phase.value !== 'exam' || !currentQuestion.value) return
    selectedByQuestion.value[currentQuestion.value.id] = optionId
    if (currentIndex.value < questions.value.length - 1) {
      currentIndex.value++
    } else {
      finalize()
    }
  }

  const finalize = () => {
    stopTimer()
    window.removeEventListener('keydown', onKeyPress)
    document.removeEventListener('visibilitychange', onVisibilityChange)
    phase.value = 'results'
  }

  const resetToBriefing = () => {
    stopTimer()
    window.removeEventListener('keydown', onKeyPress)
    document.removeEventListener('visibilitychange', onVisibilityChange)
    phase.value = 'briefing'
    questions.value = []
    selectedByQuestion.value = {}
    currentIndex.value = 0
    remainingSeconds.value = TIME_LIMIT_SECONDS
    loadError.value = null
  }

  const cleanup = () => {
    stopTimer()
    window.removeEventListener('keydown', onKeyPress)
    document.removeEventListener('visibilitychange', onVisibilityChange)
  }

  return {
    phase,
    questions,
    selectedByQuestion,
    currentIndex,
    remainingSeconds,
    loadingQuestions,
    loadError,
    formattedTime,
    currentQuestion,
    total,
    correctCount,
    answeredCount,
    successRatio,
    byCategory,
    startExam,
    answer,
    finalize,
    resetToBriefing,
    cleanup,
  }
})
