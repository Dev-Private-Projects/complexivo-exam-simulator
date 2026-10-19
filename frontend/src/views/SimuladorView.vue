<script setup lang="ts">
import {
  ArrowLeft,
  BarChart3,
  Bot,
  BotOff,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Keyboard,
  ListChecks,
  MousePointer2,
  Play,
  RotateCcw,
  Timer,
} from '@lucide/vue'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import ExplanationPanel from '@/components/ExplanationPanel.vue'
import FormattedText from '@/components/FormattedText.vue'
import { QUESTION_COUNT, TIME_LIMIT_SECONDS } from '@/constants/simulador'
import { getAiExplanation } from '@/services/ai.service'
import { useSimuladorStore } from '@/stores/simulador.store'
import {
  badgeIcon,
  badgeIconColor,
  badgeIconFill,
  categoryAccent,
  formatCategoryName,
} from '@/utils/categoryIcons'

const router = useRouter()
const store = useSimuladorStore()

const selectedOptionId = ref<number | null>(null)
const aiExplanation = ref('')
const aiLoading = ref(false)
const aiError = ref<string | null>(null)
const aiFallback = ref(false)
const segundosSiguiente = ref(10)
const useAi = ref(true)
let countdownId: ReturnType<typeof setInterval> | null = null

const isLastQuestion = computed(() => store.currentIndex === store.questions.length - 1)

type OptionState = {
  cls: string
}

const optionState = (option: { id: number; isCorrect: boolean }): OptionState => {
  const answered = selectedOptionId.value !== null
  const isSelected = selectedOptionId.value === option.id

  if (!answered) {
    return { cls: '' }
  }

  if (isSelected && option.isCorrect) {
    return { cls: 'option-correct' }
  }

  if (isSelected) {
    return { cls: 'option-wrong' }
  }

  if (option.isCorrect) {
    return { cls: 'option-reveal' }
  }

  return { cls: '' }
}

const optionStates = computed(() =>
  (store.currentQuestion?.options ?? []).map((option) => ({
    option,
    state: optionState(option),
  })),
)

const selectedIsCorrect = computed(() => {
  const question = store.currentQuestion
  if (!question || selectedOptionId.value === null) return false
  return question.options.find((o) => o.id === selectedOptionId.value)?.isCorrect ?? false
})

type InstructionSegment = { text: string; bold?: boolean }
type NoteColor = 'yellow' | 'blue' | 'green' | 'pink'
type Instruction = {
  id: string
  color: NoteColor
  icon: unknown
  segments: InstructionSegment[]
}

const instructions = computed<Instruction[]>(() => [
  {
    id: 'preguntas',
    color: 'yellow',
    icon: ListChecks,
    segments: [
      { text: 'Responderás ' },
      { text: `${QUESTION_COUNT} preguntas aleatorias`, bold: true },
      { text: ', una a la vez.' },
    ],
  },
  {
    id: 'tiempo',
    color: 'blue',
    icon: Timer,
    segments: [
      { text: 'Tiempo límite: ' },
      { text: `${Math.floor(TIME_LIMIT_SECONDS / 60)} minutos`, bold: true },
      { text: '.' },
    ],
  },
  {
    id: 'mouse',
    color: 'green',
    icon: MousePointer2,
    segments: [
      { text: 'Solo se autoriza usar el ' },
      { text: 'mouse', bold: true },
      { text: ' para seleccionar.' },
    ],
  },
  {
    id: 'teclado',
    color: 'pink',
    icon: Keyboard,
    segments: [
      { text: 'Presionar cualquier tecla', bold: true },
      { text: ' o ' },
      { text: 'cambiar de pestaña', bold: true },
      { text: ' finalizará el examen.' },
    ],
  },
])

const NOTE_COLORS: Record<NoteColor, { bg: string; text: string; icon: string }> = {
  yellow: { bg: 'sticky-note-yellow', text: 'text-pencil', icon: 'bg-white/70 text-pencil' },
  blue: { bg: 'sticky-note-blue', text: 'text-blue-900', icon: 'bg-white/70 text-blue-pen' },
  green: { bg: 'sticky-note-green', text: 'text-green-900', icon: 'bg-white/70 text-green-pen' },
  pink: { bg: 'sticky-note-pink', text: 'text-pink-900', icon: 'bg-white/70 text-pink-700' },
}

const scoreRatio = computed(() => (store.total > 0 ? store.correctCount / store.total : 0))
const wrongRatio = computed(() =>
  store.total > 0 ? (store.answeredCount - store.correctCount) / store.total : 0,
)
const pendingRatio = computed(() =>
  store.total > 0 ? (store.total - store.answeredCount) / store.total : 0,
)
const scorePercent = computed(() => Math.round(scoreRatio.value * 100))

type QuestionDetail = {
  question: (typeof store.questions)[number]
  index: number
  selectedId: number | null
  status: 'correct' | 'wrong' | 'pending'
}

const questionDetails = computed<QuestionDetail[]>(() =>
  store.questions.map((question, index) => {
    const selectedId = store.selectedByQuestion[question.id] ?? null
    const selected = question.options.find((option) => option.id === selectedId)
    const status: QuestionDetail['status'] =
      selectedId === null ? 'pending' : selected?.isCorrect ? 'correct' : 'wrong'
    return { question, index, selectedId, status }
  }),
)

const showDetails = ref(false)

const detailStatus = {
  correct: { label: 'Correcta', cls: 'bg-green-pen/10 text-green-pen' },
  wrong: { label: 'Incorrecta', cls: 'bg-red-pen/10 text-red-pen' },
  pending: { label: 'Sin responder', cls: 'bg-gray-100 text-gray-500' },
} as const

const detailOptionClass = (optionId: number, isCorrect: boolean, selectedId: number | null) => {
  if (isCorrect) return 'option-correct'
  if (optionId === selectedId) return 'option-wrong'
  return ''
}

const startCountdown = () => {
  if (countdownId) clearInterval(countdownId)
  segundosSiguiente.value = 10
  countdownId = setInterval(() => {
    if (segundosSiguiente.value <= 1) {
      clearInterval(countdownId!)
      countdownId = null
      segundosSiguiente.value = 0
    } else {
      segundosSiguiente.value--
    }
  }, 1000)
}

const selectOption = async (option: {
  id: number
  text: string
  position: number
  isCorrect: boolean
}) => {
  if (selectedOptionId.value !== null) return
  selectedOptionId.value = option.id

  recordInStore(option)

  aiFallback.value = false

  if (!useAi.value || option.isCorrect) {
    aiExplanation.value = ''
    aiError.value = null
    aiLoading.value = false
    segundosSiguiente.value = 0
    return
  }

  aiLoading.value = true
  aiError.value = null
  aiExplanation.value = ''

  const fallbackExplanation = store.currentQuestion?.explanation ?? ''

  try {
    const correctOption = store.currentQuestion?.options.find((o) => o.isCorrect)?.text ?? ''
    aiExplanation.value = await getAiExplanation({
      pregunta: store.currentQuestion?.statement ?? '',
      opcionSeleccionada: option.text,
      opcionCorrecta: correctOption,
      esCorrecta: false,
    })
  } catch (err) {
    if (fallbackExplanation) {
      aiExplanation.value = fallbackExplanation
      aiFallback.value = true
    } else {
      aiError.value = err instanceof Error ? err.message : 'Error al obtener la explicación de IA'
    }
  } finally {
    aiLoading.value = false
  }

  startCountdown()
}

const recordInStore = (option: { id: number }) => {
  store.recordAnswer(option.id)
}

const goNext = () => {
  if (selectedOptionId.value === null) return
  if (segundosSiguiente.value > 0) return
  if (countdownId) {
    clearInterval(countdownId)
    countdownId = null
  }
  selectedOptionId.value = null
  aiExplanation.value = ''
  aiError.value = null
  aiLoading.value = false
  aiFallback.value = false
  segundosSiguiente.value = 10
  store.nextQuestion()
}

onBeforeUnmount(() => {
  store.cleanup()
  if (countdownId) clearInterval(countdownId)
})

onMounted(() => {
  store.resetToBriefing()
})

watch(
  () => store.phase,
  (p) => {
    if (p !== 'exam') {
      if (countdownId) {
        clearInterval(countdownId)
        countdownId = null
      }
      selectedOptionId.value = null
      aiExplanation.value = ''
      aiError.value = null
      aiLoading.value = false
      aiFallback.value = false
      segundosSiguiente.value = 10
    }
  },
)
</script>

<template>
  <main
    class="flex min-h-screen items-start justify-center px-2 py-4 sm:items-center sm:px-4 sm:py-10"
  >
    <section
      v-if="store.phase === 'exam' && store.currentQuestion"
      class="notebook-card relative w-full max-w-2xl py-6 pr-6"
    >
      <div class="spiral-binding" aria-hidden="true">
        <span v-for="ring in 7" :key="ring" class="spiral-ring" />
      </div>

      <div>
        <div class="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-black/5">
          <div
            class="h-full rounded-full bg-blue-pen transition-all duration-500"
            :style="{
              width: `${((store.currentIndex + 1) / Math.max(store.total, 1)) * 100}%`,
            }"
          />
        </div>

        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <span
              class="inline-flex items-center"
              :style="badgeIconColor(store.currentQuestion.category.name)"
              :title="store.currentQuestion.category.name"
            >
              <component
                :is="badgeIcon(store.currentQuestion.category.name)"
                :size="16"
                :fill="badgeIconFill(store.currentQuestion.category.name)"
              />
            </span>
            <p class="text-sm text-gray-600">
              Pregunta {{ store.currentIndex + 1 }} de {{ store.total }}
            </p>
          </div>
          <div class="flex items-center gap-3">
            <button
              type="button"
              :aria-label="useAi ? 'Desactivar IA' : 'Activar IA'"
              :title="useAi ? 'IA activada' : 'IA desactivada'"
              class="note-icon-btn flex h-7 w-7 items-center justify-center"
              @click="useAi = !useAi"
            >
              <BotOff v-if="!useAi" :size="17" class="text-gray-400" />
              <Bot v-else :size="17" class="text-blue-pen" />
            </button>
            <p
              class="flex items-center gap-1.5 rounded-full bg-red-pen/10 px-2.5 py-1 text-sm tabular-nums text-red-pen"
            >
              <Timer :size="15" /> {{ store.formattedTime }}
            </p>
          </div>
        </div>

        <h1 class="mt-4 text-lg font-medium leading-7 text-pencil">
          <FormattedText :text="store.currentQuestion.statement" />
        </h1>
        <img
          v-if="store.currentQuestion.imageUrl"
          :src="store.currentQuestion.imageUrl"
          alt="Imagen de la pregunta"
          class="mx-auto mt-4 block max-h-32 w-auto rounded border border-gray-200 object-contain"
        />

        <ul class="mt-5 space-y-2">
          <li v-for="item in optionStates" :key="item.option.id">
            <button
              class="note-option flex w-full items-start gap-2"
              :class="item.state.cls"
              :disabled="selectedOptionId !== null"
              @click="selectOption(item.option)"
            >
              <span class="shrink-0 font-semibold"
                >{{ String.fromCharCode(96 + item.option.position) }})</span
              >
              <span class="min-w-0 flex-1">
                <FormattedText :text="item.option.text" />
              </span>
            </button>
          </li>
        </ul>

        <div v-if="selectedOptionId !== null && useAi && !selectedIsCorrect" class="mt-5">
          <div
            v-if="aiLoading"
            class="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500"
          >
            Analizando tu respuesta<span class="animate-pulse">…</span>
          </div>
          <div v-else-if="aiError" class="text-sm text-red-600">{{ aiError }}</div>
          <div v-else>
            <p v-if="aiFallback" class="mb-2 text-xs text-gray-500 italic">
              Explicación guardada en el banco de preguntas
            </p>
            <ExplanationPanel
              :text="aiExplanation"
              :open="true"
              :source="aiFallback ? 'doc' : 'ai'"
            />
          </div>
        </div>

        <div class="mt-6 flex items-center justify-between gap-3">
          <p v-if="selectedOptionId === null" class="text-sm text-gray-500">
            Selecciona una opción para continuar
          </p>
          <span v-else />
          <button
            class="note-btn-cta group flex items-center gap-2"
            :disabled="!selectedOptionId || segundosSiguiente > 0"
            @click="goNext"
          >
            <span>
              {{ isLastQuestion ? 'Finalizar' : 'Siguiente' }}
              <span v-if="selectedOptionId && segundosSiguiente > 0"
                >({{ segundosSiguiente }}s)</span
              >
            </span>
            <ChevronRight
              :size="15"
              class="text-red-pen transition-transform group-hover:scale-110"
            />
          </button>
        </div>
      </div>
    </section>

    <section
      v-else-if="store.phase === 'results'"
      class="notebook-card relative w-full max-w-5xl py-6 pr-6"
    >
      <div class="spiral-binding" aria-hidden="true">
        <span v-for="ring in 8" :key="ring" class="spiral-ring" />
      </div>

      <div>
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 class="text-3xl leading-none font-bold text-pencil">Informe de resultados</h2>
            <p class="mt-1 text-sm text-gray-500">Simulación de examen complexivo</p>
          </div>
          <button class="note-btn group flex items-center gap-1.5" @click="store.resetToBriefing">
            <RotateCcw :size="14" class="transition-transform group-hover:scale-110" />
            <span>Nueva simulación</span>
          </button>
        </div>

        <div class="mt-5 rounded-lg border border-gray-200 bg-white px-5 py-4">
          <div class="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p class="text-xs text-gray-500">Puntaje obtenido</p>
              <p class="text-4xl leading-none font-bold text-pencil">
                {{ scorePercent }}<span class="text-2xl">%</span>
              </p>
            </div>
            <p class="text-sm text-gray-600">
              {{ store.correctCount }} de {{ store.total }} respuestas correctas
            </p>
          </div>

          <div class="mt-3 flex h-3 w-full overflow-hidden rounded-full bg-gray-100">
            <div class="bg-green-pen" :style="{ width: `${scoreRatio * 100}%` }" />
            <div class="bg-red-pen" :style="{ width: `${wrongRatio * 100}%` }" />
            <div class="bg-blue-300" :style="{ width: `${pendingRatio * 100}%` }" />
          </div>

          <div class="mt-2.5 flex flex-wrap gap-4 text-[11px] text-gray-500">
            <span class="flex items-center gap-1.5">
              <span class="h-2 w-2 rounded-full bg-green-pen" />
              Correctas {{ store.correctCount }}
            </span>
            <span class="flex items-center gap-1.5">
              <span class="h-2 w-2 rounded-full bg-red-pen" />
              Incorrectas {{ store.answeredCount - store.correctCount }}
            </span>
            <span class="flex items-center gap-1.5">
              <span class="h-2 w-2 rounded-full bg-blue-300" />
              No contestadas {{ store.total - store.answeredCount }}
            </span>
          </div>
        </div>

        <div class="mt-4 rounded-lg border border-gray-200 bg-white p-4">
          <h3 class="flex items-center gap-1.5 text-sm font-semibold text-pencil">
            <BarChart3 :size="15" /> Aciertos por materia
          </h3>
          <div class="mt-1.5 flex gap-3 text-[10px] text-gray-500">
            <span class="flex items-center gap-1"
              ><span class="h-1.5 w-1.5 rounded-full bg-green-pen" />Aciertos</span
            >
            <span class="flex items-center gap-1"
              ><span class="h-1.5 w-1.5 rounded-full bg-red-pen" />Fallas</span
            >
            <span class="flex items-center gap-1"
              ><span class="h-1.5 w-1.5 rounded-full bg-blue-300" />No contestadas</span
            >
          </div>

          <ul class="mt-3 gap-x-8 gap-y-2.5 md:columns-2 xl:columns-3">
            <li v-for="item in store.byCategory" :key="item.name" class="break-inside-avoid">
              <div class="flex items-center justify-between gap-2">
                <span class="flex min-w-0 items-center gap-1.5 text-[13px] text-pencil">
                  <span class="shrink-0" :style="{ color: categoryAccent(item.name) }">
                    <component :is="badgeIcon(item.name)" :size="12" />
                  </span>
                  <span class="truncate">{{ formatCategoryName(item.name) }}</span>
                </span>
                <span class="shrink-0 text-[11px] text-gray-500">
                  {{ item.correct }}/{{ item.total }}
                </span>
              </div>
              <div class="mt-1 flex h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  class="bg-green-pen"
                  :style="{ width: `${item.total > 0 ? (item.correct / item.total) * 100 : 0}%` }"
                />
                <div
                  class="bg-red-pen"
                  :style="{
                    width: `${item.total > 0 ? (item.incorrect / item.total) * 100 : 0}%`,
                  }"
                />
                <div
                  class="bg-blue-300"
                  :style="{
                    width: `${item.total > 0 ? (item.unanswered / item.total) * 100 : 0}%`,
                  }"
                />
              </div>
            </li>
          </ul>
        </div>

        <div class="mt-4 flex justify-end">
          <button
            class="note-btn group flex items-center gap-1.5"
            :aria-expanded="showDetails"
            @click="showDetails = !showDetails"
          >
            <ClipboardList :size="14" class="text-blue-pen" />
            <span>
              {{ showDetails ? 'Ocultar cuestionario' : 'Más detalles' }}
            </span>
            <ChevronDown
              :size="14"
              class="text-gray-500 transition-transform"
              :class="showDetails ? 'rotate-180' : ''"
            />
          </button>
        </div>

        <div v-if="showDetails" class="mt-4 space-y-3">
          <div
            v-for="item in questionDetails"
            :key="item.question.id"
            class="rounded-lg border border-gray-200 bg-white p-4"
          >
            <div class="flex items-start justify-between gap-3">
              <p class="font-medium leading-7 text-gray-900">
                <span class="mr-1 text-xl font-bold text-gray-500">{{ item.index + 1 }}.</span>
                <FormattedText :text="item.question.statement" />
              </p>
              <span
                class="shrink-0 rounded-full px-2 py-0.5 text-[11px] whitespace-nowrap"
                :class="detailStatus[item.status].cls"
              >
                {{ detailStatus[item.status].label }}
              </span>
            </div>

            <ul class="mt-2 space-y-1">
              <li
                v-for="option in item.question.options"
                :key="option.id"
                class="flex items-start gap-2 rounded px-2 py-1 text-sm"
                :class="detailOptionClass(option.id, option.isCorrect, item.selectedId)"
              >
                <span class="shrink-0 font-semibold"
                  >{{ String.fromCharCode(96 + option.position) }})</span
                >
                <span class="min-w-0 flex-1"><FormattedText :text="option.text" /></span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <section v-else class="relative mx-auto w-full max-w-lg">
      <div class="notebook-card pt-7 pb-7 pr-6">
        <div class="spiral-binding" aria-hidden="true">
          <span v-for="ring in 9" :key="ring" class="spiral-ring" />
        </div>

        <h2 class="text-3xl leading-none font-bold text-pencil">Simulador de examen complexivo</h2>
        <p class="mt-1.5 text-sm text-gray-500">Lee con atención antes de comenzar</p>

        <div class="mt-6 grid gap-5 sm:grid-cols-2">
          <div
            v-for="(instruction, index) in instructions"
            :key="instruction.id"
            class="sticky-note px-4 py-3"
            :class="NOTE_COLORS[instruction.color].bg"
            :style="{ transform: `rotate(${index % 2 === 0 ? -1.5 : 1.5}deg)` }"
          >
            <div class="flex items-start gap-2.5">
              <span
                class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                :class="NOTE_COLORS[instruction.color].icon"
              >
                <component :is="instruction.icon" :size="14" />
              </span>
              <div class="min-w-0">
                <p
                  class="text-sm leading-none font-semibold"
                  :class="NOTE_COLORS[instruction.color].text"
                >
                  {{ index + 1 }}.
                </p>
                <p class="text-[14px] leading-6" :class="NOTE_COLORS[instruction.color].text">
                  <span
                    v-for="(segment, segIndex) in instruction.segments"
                    :key="segIndex"
                    :class="segment.bold ? 'font-semibold text-ink' : ''"
                  >
                    {{ segment.text }}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <p
          v-if="store.loadError"
          class="mt-5 rounded border border-red-pen/30 bg-red-pen/5 px-3 py-2 text-sm text-red-pen"
        >
          {{ store.loadError }}
        </p>

        <button
          class="note-btn-cta group mt-7 flex w-full items-center justify-center gap-2"
          :disabled="store.loadingQuestions"
          @click="store.startExam"
        >
          <Play :size="15" class="text-red-pen transition-transform group-hover:scale-110" />
          <span>{{ store.loadingQuestions ? 'Cargando…' : 'Comenzar examen' }}</span>
        </button>

        <button
          class="group mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm text-gray-500 transition-colors hover:bg-black/5 hover:text-pencil"
          @click="router.push('/')"
        >
          <ArrowLeft :size="14" class="transition-transform group-hover:scale-110" />
          <span>Volver</span>
        </button>
      </div>
    </section>
  </main>
</template>
