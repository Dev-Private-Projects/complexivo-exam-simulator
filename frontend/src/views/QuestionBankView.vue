<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ListFilter,
  Play,
  Search,
  ServerOff,
  X,
  Lightbulb,
} from '@lucide/vue'

import {
  badgeIconColor,
  badgeIcon,
  badgeIconFill,
  categoryAccent,
  formatCategoryName,
} from '@/utils/categoryIcons'

import { useQuestionStore } from '@/stores/question.store'
import { useHealthStore } from '@/stores/health.store'
import { HEALTH_MESSAGE_INTERVAL } from '@/constants/health'
import ExplanationPanel from '@/components/ExplanationPanel.vue'
import FormattedText from '@/components/FormattedText.vue'

const store = useQuestionStore()
const healthStore = useHealthStore()

const searchText = ref('')
const detailsRef = ref<HTMLDetailsElement | null>(null)
let searchTimer: ReturnType<typeof setTimeout> | null = null

const onSearchInput = () => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }
  searchTimer = setTimeout(() => {
    store.setSearch(searchText.value)
  }, 350)
}

const canStartSimulation = computed(() => healthStore.status === 'ready')
const onStartSimulationClick = (event: MouseEvent) => {
  if (!canStartSimulation.value) {
    event.preventDefault()
  }
}

const categoryLabel = computed(() => {
  const count = store.selectedCategoryIds.length
  if (count === 0) return 'Todas las categorías'
  if (count === store.categories.length) return 'Todas las categorías'
  if (count === 1) {
    const only = store.categories.find((c) => c.id === store.selectedCategoryIds[0])
    return only ? formatCategoryName(only.name) : '1 categoría'
  }
  return `${count} categorías`
})

const toggleCategory = (id: number) => {
  const isSelected = store.selectedCategoryIds.includes(id)
  store.setCategories(
    isSelected
      ? store.selectedCategoryIds.filter((current) => current !== id)
      : [...store.selectedCategoryIds, id],
  )
}

const MAX_VISIBLE_CHIPS = 4

const visibleSelectedCategories = computed(() =>
  store.selectedCategoryIds
    .slice(0, MAX_VISIBLE_CHIPS)
    .map((id) => store.categories.find((category) => category.id === id))
    .filter((category): category is NonNullable<typeof category> => Boolean(category)),
)

const hiddenSelectedCount = computed(() =>
  Math.max(0, store.selectedCategoryIds.length - MAX_VISIBLE_CHIPS),
)

const openedExplanationId = ref<number | null>(null)
const toggleExplanation = (id: number) => {
  openedExplanationId.value = openedExplanationId.value === id ? null : id
}

const onSelectSummaryClick = (event: Event) => {
  if (store.categories.length === 0) {
    event.preventDefault()
  }
}

const onDocumentClick = (event: MouseEvent) => {
  if (detailsRef.value && !detailsRef.value.contains(event.target as Node)) {
    detailsRef.value.removeAttribute('open')
  }
}

const wakingMessages = [
  'Despertando el servidor',
  'El servidor sigue despertando',
  'Ya casi está despierto',
  'Casi listo',
  'Listo para comenzar',
  'Preparando el entorno',
  'Cargando recursos',
]

const currentMessageIndex = ref(0)
let messageTimer: ReturnType<typeof setInterval> | null = null

const startMessageRotation = () => {
  if (messageTimer) return
  messageTimer = setInterval(() => {
    currentMessageIndex.value = (currentMessageIndex.value + 1) % wakingMessages.length
  }, HEALTH_MESSAGE_INTERVAL)
}

const stopMessageRotation = () => {
  if (messageTimer) {
    clearInterval(messageTimer)
    messageTimer = null
  }
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)

  watch(
    () => healthStore.status,
    (newStatus) => {
      if (newStatus === 'ready') {
        if (!store.categoriesLoaded) {
          void store.loadCategories()
        }
        if (!store.questionsLoaded) {
          void store.loadQuestions()
        }
        stopMessageRotation()
        return
      }

      if (newStatus === 'checking') {
        startMessageRotation()
      }
    },
    { immediate: true },
  )
})

onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick)
  stopMessageRotation()
})
</script>

<template>
  <main class="mx-auto w-full max-w-6xl px-4 pb-16 pt-6">
    <div
      v-if="healthStore.status !== 'ready'"
      class="flex min-h-[calc(100vh-7rem)] flex-col items-center justify-center text-center"
    >
      <div v-if="healthStore.status === 'checking'" class="flex flex-col items-center gap-5">
        <p class="flex items-center gap-0.5 text-base text-pencil">
          <span :key="currentMessageIndex" class="message-swap">
            <span class="shimmer-text">{{ wakingMessages[currentMessageIndex] }}</span>
          </span>
          <span class="flex w-4 overflow-hidden" aria-hidden="true">
            <span class="animate-pulse">.</span>
            <span class="animate-pulse [animation-delay:200ms]">.</span>
            <span class="animate-pulse [animation-delay:400ms]">.</span>
          </span>
        </p>

        <div
          class="h-1 w-56 overflow-hidden rounded-full bg-black/5"
          role="progressbar"
          aria-label="Cargando"
        >
          <div class="loading-bar h-full w-1/3 rounded-full bg-blue-pen/70" />
        </div>

        <p class="text-xs text-gray-400">El servidor puede tardar unos segundos en despertar</p>
      </div>

      <div v-else class="flex flex-col items-center gap-3 text-red-600">
        <ServerOff :size="32" />
        <p class="text-sm">
          No se pudo conectar con el servidor. Verifica que el backend esté encendido.
        </p>
      </div>
    </div>

    <div v-else class="grid items-start gap-8 lg:grid-cols-[25%_1fr]">
      <aside class="flex flex-col gap-5 lg:sticky lg:top-10">
        <div class="sticky-note sticky-note-blue p-4 pt-6" style="transform: rotate(-2deg)">
          <h1 class="text-2xl font-bold text-blue-900">Banco de preguntas</h1>
          <p class="mt-1 text-sm text-blue-800">
            Preparación para la carrera Tecnología Superior en Desarrollo de Software
          </p>
        </div>

        <div class="note-sheet flex items-center gap-2 rounded px-3 py-1">
          <Search
            class="shrink-0 text-pencil-light transition-colors group-focus-within:text-blue-pen"
            :size="15"
          />
          <input
            v-model="searchText"
            type="text"
            placeholder="Buscar pregunta..."
            class="min-w-0 flex-1 border-none bg-transparent py-0.5 text-sm text-pencil placeholder-gray-400 focus:outline-none"
            @input="onSearchInput"
          />
          <button
            v-if="searchText"
            type="button"
            aria-label="Limpiar búsqueda"
            class="note-icon-btn p-0.5 hover:!text-red-pen"
            @click="searchText = ''"
          >
            <X :size="14" />
          </button>
        </div>

        <div class="sticky-note sticky-note-yellow relative mx-auto w-full p-4 pt-6">
          <details ref="detailsRef" class="relative">
            <summary
              class="flex w-full list-none cursor-pointer items-center justify-between gap-2 rounded-lg px-2 py-1 text-sm font-medium text-gray-700 transition-all hover:bg-yellow-100/50 [&::-webkit-details-marker]:hidden"
              @click="onSelectSummaryClick"
            >
              <span class="flex items-center gap-2">
                <ListFilter :size="16" class="text-blue-pen" />
                <span>{{ categoryLabel }}</span>
              </span>
              <ChevronDown
                :size="16"
                class="text-gray-500 transition-transform"
                :class="detailsRef?.open ? 'rotate-180' : ''"
              />
            </summary>

            <div
              class="absolute z-30 mt-2 h-56 w-full overflow-y-auto rounded-lg border-2 border-gray-200 bg-white p-2 shadow-lg"
            >
              <button
                v-for="category in store.categories"
                :key="category.id"
                type="button"
                class="note-menu-item flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm"
                @click="toggleCategory(category.id)"
              >
                <span
                  class="flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border transition-colors"
                  :class="
                    store.selectedCategoryIds.includes(category.id)
                      ? 'border-blue-pen bg-blue-pen text-white'
                      : 'border-gray-300'
                  "
                >
                  <Check
                    v-if="store.selectedCategoryIds.includes(category.id)"
                    :size="11"
                    :stroke-width="3"
                  />
                </span>
                <span class="truncate">{{ formatCategoryName(category.name) }}</span>
              </button>

              <p
                v-if="store.categories.length === 0"
                class="px-2 py-2 text-center text-sm italic text-gray-400"
              >
                Sin categorías
              </p>
            </div>
          </details>

          <div
            v-if="store.selectedCategoryIds.length > 0"
            class="mt-3 flex flex-wrap items-center gap-1.5"
          >
            <button
              v-for="category in visibleSelectedCategories"
              :key="category.id"
              type="button"
              class="group flex max-w-full items-center gap-1 rounded border border-blue-pen/30 bg-blue-pen/10 px-1.5 py-0.5 text-left transition-colors hover:bg-blue-pen/20"
              :aria-label="`Quitar filtro ${category.name}`"
              @click="toggleCategory(category.id)"
            >
              <span class="truncate text-[11px] text-blue-900">
                {{ formatCategoryName(category.name) }}
              </span>
              <X
                :size="11"
                class="shrink-0 text-blue-pen/60 transition-colors group-hover:text-red-pen"
              />
            </button>

            <span
              v-if="hiddenSelectedCount > 0"
              class="rounded border border-gray-300/70 bg-white/60 px-1.5 py-0.5 text-[11px] text-gray-500"
            >
              +{{ hiddenSelectedCount }}
            </span>
          </div>
        </div>

        <div class="note-sheet grid grid-cols-[auto_1fr_auto] items-center gap-2 rounded px-2 py-2">
          <button
            class="note-icon-btn group flex h-7 w-7 items-center justify-center rounded disabled:pointer-events-none disabled:opacity-25"
            :disabled="store.currentPage <= 1"
            aria-label="Página anterior"
            @click="store.goToPage(store.currentPage - 1)"
          >
            <ChevronLeft
              :size="15"
              class="text-blue-pen transition-colors group-hover:text-red-pen"
            />
          </button>

          <div class="flex min-w-0 flex-col items-center gap-0.5 text-center">
            <p class="text-lg leading-none font-semibold text-pencil">
              {{ store.currentPage }}
              <span class="text-sm text-pencil-light">/ {{ store.totalPages }}</span>
            </p>
            <p class="text-[10px] leading-none text-gray-500">
              {{ store.questions.length }} preguntas
            </p>
          </div>

          <button
            class="note-icon-btn group flex h-7 w-7 items-center justify-center rounded disabled:pointer-events-none disabled:opacity-25"
            :disabled="store.currentPage >= store.totalPages"
            aria-label="Página siguiente"
            @click="store.goToPage(store.currentPage + 1)"
          >
            <ChevronRight
              :size="15"
              class="text-blue-pen transition-colors group-hover:text-red-pen"
            />
          </button>
        </div>

        <RouterLink
          to="/simulador"
          class="note-btn group flex items-center justify-center gap-1.5"
          :class="canStartSimulation ? '' : 'pointer-events-none opacity-50'"
          @click="onStartSimulationClick"
        >
          <Play
            :size="13"
            class="ml-0.5 text-blue-pen transition-transform group-hover:scale-110"
          />
          <span class="text-sm">Simulación</span>
        </RouterLink>
      </aside>

      <section class="relative" :class="{ 'min-h-[calc(100vh-3rem)]': store.questionsLoading }">
        <div
          v-if="store.questionsLoading"
          class="absolute inset-0 flex flex-col items-center justify-center gap-0.5 text-center"
        >
          <p class="flex items-center gap-0.5 text-sm">
            <span class="shimmer-text">Cargando preguntas</span>
            <span class="flex w-3 overflow-hidden" aria-hidden="true">
              <span class="animate-pulse">.</span>
              <span class="animate-pulse [animation-delay:200ms]">.</span>
              <span class="animate-pulse [animation-delay:400ms]">.</span>
            </span>
          </p>
        </div>
        <div
          v-else-if="store.questionsError"
          class="flex flex-col items-center gap-3 py-16 text-center text-red-600"
        >
          <ServerOff :size="32" />
          <p class="text-sm">{{ store.questionsError }}</p>
        </div>
        <p v-else-if="store.pageQuestions.length === 0" class="text-sm text-gray-500">
          No hay preguntas que coincidan con tu búsqueda.
        </p>

        <ul v-else class="space-y-6">
          <li
            v-for="(question, index) in store.pageQuestions"
            :key="question.id"
            class="notebook-card notebook-card--ruled group/card relative overflow-hidden py-4 pr-4"
            :style="{ '--notebook-margin-color': categoryAccent(question.category.name) }"
          >
            <div class="spiral-binding" aria-hidden="true">
              <span v-for="ring in 5" :key="ring" class="spiral-ring" />
            </div>

            <div>
              <div class="flex items-start justify-between gap-3">
                <p class="font-medium text-gray-900">
                  <span class="mr-1 text-xl font-bold text-gray-500"
                    >{{ (store.currentPage - 1) * 10 + index + 1 }}.</span
                  >
                  <FormattedText :text="question.statement" />
                </p>
                <div class="flex shrink-0 items-center gap-2">
                  <span
                    class="inline-flex items-center"
                    :style="badgeIconColor(question.category.name)"
                    :title="question.category.name"
                  >
                    <component
                      :is="badgeIcon(question.category.name)"
                      :size="16"
                      :fill="badgeIconFill(question.category.name)"
                    />
                  </span>
                  <button
                    type="button"
                    class="note-icon-btn group flex h-6 w-6 items-center justify-center"
                    :aria-label="'Mostrar explicación de la pregunta ' + question.id"
                    :class="
                      openedExplanationId === question.id
                        ? 'text-amber-500 animate-pulse drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]'
                        : 'text-gray-400'
                    "
                    @click="toggleExplanation(question.id)"
                  >
                    <Lightbulb :size="17" class="transition-colors group-hover:text-amber-500" />
                  </button>
                </div>
              </div>

              <ul class="mt-2 space-y-1">
                <li
                  v-for="option in question.options"
                  :key="option.id"
                  class="inline-flex w-fit max-w-full items-start gap-1.5 rounded px-2 py-1 text-sm"
                  :class="
                    option.isCorrect
                      ? 'note-highlight relative z-10 origin-left text-yellow-900 transition-transform duration-300 ease-out group-hover/card:scale-[1.07]'
                      : 'text-gray-600'
                  "
                >
                  <span class="shrink-0 font-semibold"
                    >{{ String.fromCharCode(96 + option.position) }})</span
                  >
                  <span><FormattedText :text="option.text" /></span>
                </li>
              </ul>

              <ExplanationPanel
                v-if="question.explanation"
                :text="question.explanation"
                :open="openedExplanationId === question.id"
                source="doc"
              />
            </div>
          </li>
        </ul>
      </section>
    </div>
  </main>
</template>
