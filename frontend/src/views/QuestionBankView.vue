<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  Atom,
  Boxes,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Code,
  Cpu,
  Database,
  GitBranch,
  Globe,
  GraduationCap,
  ListFilter,
  LoaderCircle,
  Play,
  Radio,
  Search,
  ServerOff,
  ShieldCheck,
  Sigma,
  SquareRadical,
  Terminal,
  Wifi,
  X,
  Zap,
} from '@lucide/vue'

import { useQuestionStore } from '@/stores/question.store'
import { useHealthStore } from '@/stores/health.store'

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

const availableCategories = computed(() =>
  store.categories.filter((category) => !store.selectedCategoryIds.includes(category.id)),
)

const visibleSelectedIds = computed(() => store.selectedCategoryIds.slice(0, 4))
const hiddenSelectedCount = computed(() => Math.max(0, store.selectedCategoryIds.length - 4))
const selectDisabled = computed(() => availableCategories.value.length === 0)

const addCategory = (id: number) => {
  store.setCategories([...store.selectedCategoryIds, id])
  detailsRef.value?.removeAttribute('open')
}

const removeCategory = (id: number) => {
  store.setCategories(store.selectedCategoryIds.filter((current) => current !== id))
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  'CALCULO I': { bg: '#dbeafe', text: '#1e40af' },
  'CALCULO II': { bg: '#e0e7ff', text: '#3730a3' },
  'ENTORNO VIRTUAL DE APRENDIZAJE': { bg: '#fef3c7', text: '#92400e' },
  'ARQUITECTURA DEL COMPUTADOR': { bg: '#f3e8ff', text: '#6b21a8' },
  'ELECTROTECNIA': { bg: '#dcfce7', text: '#166534' },
  'ESTRUCTURA DE DATOS': { bg: '#ccfbf1', text: '#115e59' },
  FISICA: { bg: '#fee2e2', text: '#991b1b' },
  'FUNDAMENTOS DE BASE DE DATOS': { bg: '#fce7f3', text: '#9d174d' },
  'FUNDAMENTOS DE PROGRAMACION': { bg: '#e0f2fe', text: '#075985' },
  'PROGRAMACION ORIENTADA A OBJETOS': { bg: '#cffafe', text: '#155e75' },
  'REDES DE DATOS': { bg: '#fef9c3', text: '#854d0e' },
  'SEGURIDAD DE APLICACIONES': { bg: '#ffe4e6', text: '#9f1239' },
  'SISTEMAS OPERATIVOS': { bg: '#ede9fe', text: '#5b21b6' },
  'TECNOLOGIA DE TELECOMUNICACIONES': { bg: '#d1fae5', text: '#065f46' },
  'INGENIERIA DE SOFTWARE': { bg: '#f1f5f9', text: '#334155' },
}

const badgeIconColor = (name: string) => {
  const color = CATEGORY_COLORS[name] ?? { bg: '#f3f4f6', text: '#374151' }
  return { color: color.text }
}

const CATEGORY_ICONS: Record<string, unknown> = {
  'CALCULO I': SquareRadical,
  'CALCULO II': Sigma,
  'ENTORNO VIRTUAL DE APRENDIZAJE': GraduationCap,
  'ARQUITECTURA DEL COMPUTADOR': Cpu,
  'ELECTROTECNIA': Zap,
  'ESTRUCTURA DE DATOS': Boxes,
  FISICA: Atom,
  'FUNDAMENTOS DE BASE DE DATOS': Database,
  'FUNDAMENTOS DE PROGRAMACION': Code,
  'PROGRAMACION ORIENTADA A OBJETOS': Boxes,
  'REDES DE DATOS': Globe,
  'SEGURIDAD DE APLICACIONES': ShieldCheck,
  'SISTEMAS OPERATIVOS': Terminal,
  'TECNOLOGIA DE TELECOMUNICACIONES': Radio,
  'INGENIERIA DE SOFTWARE': GitBranch,
}

const badgeIcon = (name: string) => CATEGORY_ICONS[name] ?? Code

const onSelectSummaryClick = (event: Event) => {
  if (selectDisabled.value) {
    event.preventDefault()
  }
}

const onDocumentClick = (event: MouseEvent) => {
  if (detailsRef.value && !detailsRef.value.contains(event.target as Node)) {
    detailsRef.value.removeAttribute('open')
  }
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)

  watch(
    () => healthStore.status,
    (newStatus) => {
      if (newStatus === 'ready') {
        void store.loadCategories()
        void store.loadQuestions()
      }
    },
    { immediate: true },
  )
})

onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick)
})
</script>

<template>
  <main class="mx-auto w-full max-w-6xl px-4 pb-16 pt-10">
    <div class="grid items-start gap-8 lg:grid-cols-[300px_1fr]">
      <aside class="flex flex-col gap-8 lg:sticky lg:top-10">
        <div>
          <h1 class="text-2xl font-semibold tracking-tight text-gray-900">Banco de preguntas</h1>
          <p class="mt-1 text-sm text-gray-500">
            Explora y estudia las preguntas de las diferentes materias.
          </p>
        </div>

        <label class="relative">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" :size="16" />
          <input
            v-model="searchText"
            type="search"
            placeholder="Buscar pregunta…"
            class="w-full rounded-full border border-gray-200 py-2 pl-9 pr-4 text-sm text-gray-700 focus:border-gray-400 focus:outline-none"
            @input="onSearchInput"
          />
        </label>

        <details ref="detailsRef" class="relative">
          <summary
            class="flex w-full list-none items-center justify-between gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm text-gray-700 [&::-webkit-details-marker]:hidden"
            :class="selectDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'"
            @click="onSelectSummaryClick"
          >
            <span class="flex items-center gap-2">
              <ListFilter :size="16" class="text-gray-400" />
              {{ selectDisabled ? 'Todas las categorías' : 'Agregar categoría' }}
            </span>
            <ChevronDown :size="16" class="text-gray-400" />
          </summary>

          <div class="absolute z-30 mt-2 w-full rounded-2xl border border-gray-200 bg-white p-2 shadow-lg">
            <button
              v-for="category in availableCategories"
              :key="category.id"
              type="button"
              class="block w-full rounded-lg px-2 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50"
              @click="addCategory(category.id)"
            >
              {{ category.name }}
            </button>
            <p v-if="availableCategories.length === 0" class="px-2 py-2 text-center text-sm text-gray-400">
              Todas las categorías están seleccionadas
            </p>
          </div>
        </details>

        <div class="flex min-h-10 flex-wrap items-center gap-2">
          <template v-if="store.selectedCategoryIds.length > 0">
            <span
              v-for="id in visibleSelectedIds"
              :key="id"
              class="flex items-center gap-1.5 rounded-full bg-gray-900 px-3 py-1 text-xs font-medium text-white"
            >
              {{ store.categories.find((c) => c.id === id)?.name }}
              <button type="button" aria-label="Quitar categoría" @click="removeCategory(id)">
                <X :size="14" />
              </button>
            </span>
            <span
              v-if="hiddenSelectedCount > 0"
              class="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600"
            >
              +{{ hiddenSelectedCount }}
            </span>
          </template>
          <p v-else class="w-full text-center text-xs text-gray-400">Sin filtro de categorías</p>
        </div>

        <RouterLink
          to="/simulador"
          class="flex items-center justify-center gap-2 rounded-full bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition"
          :class="canStartSimulation ? 'hover:opacity-90' : 'pointer-events-none opacity-50'"
          @click="onStartSimulationClick"
        >
          <Play :size="16" />
          Iniciar simulación
        </RouterLink>

        <nav class="flex flex-col items-center gap-3">
          <p class="order-1 text-xs text-gray-400">
            Página {{ store.currentPage }} de {{ store.totalPages }} · {{ store.questions.length }} preguntas
          </p>
          <div class="flex items-center gap-3">
            <button
              class="flex items-center gap-1.5 rounded-full border border-gray-200 px-5 py-2 text-sm text-gray-700 disabled:opacity-40"
              :disabled="store.currentPage <= 1"
              @click="store.goToPage(store.currentPage - 1)"
            >
              <ChevronLeft :size="16" />
              Anterior
            </button>
            <button
              class="flex items-center gap-1.5 rounded-full border border-gray-200 px-5 py-2 text-sm text-gray-700 disabled:opacity-40"
              :disabled="store.currentPage >= store.totalPages"
              @click="store.goToPage(store.currentPage + 1)"
            >
              Siguiente
              <ChevronRight :size="16" />
            </button>
          </div>
        </nav>
      </aside>

      <section>
        <div v-if="healthStore.status === 'checking'" class="flex flex-col items-center gap-3 py-16 text-center text-gray-400">
          <LoaderCircle :size="32" class="animate-spin" />
          <p class="text-sm">Preparando el banco de preguntas…</p>
        </div>

        <div v-else-if="healthStore.status === 'error'" class="flex flex-col items-center gap-3 py-16 text-center text-red-600">
          <ServerOff :size="32" />
          <p class="text-sm">No se pudo conectar con el servidor. Verifica que el backend esté encendido.</p>
        </div>

        <div v-else>
          <div v-if="store.questionsLoading" class="flex flex-col items-center gap-3 py-16 text-center text-gray-400">
            <LoaderCircle :size="32" class="animate-spin" />
            <p class="text-sm">Cargando preguntas…</p>
          </div>
          <div v-else-if="store.questionsError" class="flex flex-col items-center gap-3 py-16 text-center text-red-600">
            <ServerOff :size="32" />
            <p class="text-sm">{{ store.questionsError }}</p>
          </div>
          <p v-else-if="store.pageQuestions.length === 0" class="text-sm text-gray-400">
            No hay preguntas que coincidan con tu búsqueda.
          </p>

          <ul v-else class="space-y-6">
          <li v-for="(question, index) in store.pageQuestions" :key="question.id" class="rounded-lg border border-gray-100 p-4">
            <div class="flex items-start justify-between gap-3">
              <p class="font-medium text-gray-900">
                <span class="mr-1 font-semibold text-gray-400">{{ (store.currentPage - 1) * 10 + index + 1 }}.</span>
                {{ question.statement }}
              </p>
              <span
                class="inline-flex shrink-0 items-center"
                :style="badgeIconColor(question.category.name)"
                :title="question.category.name"
              >
                <component :is="badgeIcon(question.category.name)" :size="16" />
              </span>
            </div>

            <ul class="mt-3 space-y-1.5">
              <li
                v-for="option in question.options"
                :key="option.id"
                class="flex items-start gap-2 text-sm"
                :class="option.isCorrect ? 'rounded-md bg-green-50 px-2 py-1.5 text-green-700' : 'text-gray-600'"
              >
                <CircleCheck v-if="option.isCorrect" :size="16" class="mt-0.5 shrink-0 text-green-600" />
                <span>{{ option.position }}. {{ option.text }}</span>
              </li>
            </ul>
          </li>
        </ul>
        </div>
      </section>
    </div>
  </main>
</template>
