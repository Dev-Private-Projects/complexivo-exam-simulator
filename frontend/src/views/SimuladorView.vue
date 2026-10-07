<script setup lang="ts">
import { onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, BarChart3, CircleCheck, ClipboardCheck, LayoutDashboard, ListChecks, MessageSquare, PieChart, Play, RotateCcw, Timer, XCircle } from '@lucide/vue'

import { useSimuladorStore } from '@/stores/simulador.store'
import { DONUT_CIRCUMFERENCE, QUESTION_COUNT, TIME_LIMIT_SECONDS } from '@/constants/simulador'
import FormattedText from '@/components/FormattedText.vue'

const router = useRouter()
const store = useSimuladorStore()

onBeforeUnmount(() => {
  store.cleanup()
})
</script>


<template>
  <main class="flex min-h-screen items-start justify-center bg-gray-50 px-2 py-4 sm:items-center sm:px-4 sm:py-10">
    <section v-if="store.phase === 'exam' && store.currentQuestion" class="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl ring-1 ring-gray-100">
      <div class="flex items-center justify-between">
        <p class="text-sm text-gray-500">Pregunta {{ store.currentIndex + 1 }} de {{ store.total }}</p>
        <p class="flex items-center gap-1.5 text-sm font-medium text-gray-700">
          <Timer :size="16" /> {{ store.formattedTime }}
        </p>
      </div>
      <h1 class="mt-4 font-medium text-gray-900"><FormattedText :text="store.currentQuestion.statement" /></h1>
      <ul class="mt-5 space-y-2">
        <li v-for="option in store.currentQuestion.options" :key="option.id">
          <button
            class="w-full rounded-lg border border-gray-200 px-4 py-3 text-left text-sm text-gray-700 transition hover:border-gray-400 hover:bg-gray-50"
            @click="store.answer(option.id)"
          >
            {{ option.position }}. <FormattedText :text="option.text" />
          </button>
        </li>
      </ul>
      <div class="mt-6 flex justify-end">
        <button class="rounded-full border border-gray-200 px-5 py-2 text-sm text-gray-700" @click="store.finalize">
          Finalizar
        </button>
      </div>
    </section>

    <section v-else-if="store.phase === 'results'" class="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl ring-1 ring-gray-100 sm:p-6 lg:max-w-6xl">
      <div class="flex items-center justify-between">
        <h2 class="flex items-center gap-2 text-lg font-semibold text-gray-900">
          Informe de resultados
        </h2>
        <button class="rounded-full bg-gray-900 px-5 py-2 text-sm font-medium text-white" @click="store.resetToBriefing">
          <RotateCcw :size="16" class="mr-1 inline-block" /> Nueva simulación
        </button>
      </div>

      <div class="mt-6 grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)_minmax(0,1.4fr)]">
        <div class="min-w-0 rounded-xl border border-gray-100 p-4">
          <h3 class="flex items-center gap-1.5 text-sm font-medium text-gray-700">
            <LayoutDashboard :size="16" /> Resumen general
          </h3>
          <div class="mt-4 grid grid-cols-2 gap-x-4 gap-y-5">
            <div>
              <p class="flex items-center gap-1.5 text-3xl font-semibold text-gray-900"><ListChecks :size="22" />{{ store.total }}</p>
              <p class="text-xs text-gray-500">Total</p>
            </div>
            <div>
              <p class="flex items-center gap-1.5 text-3xl font-semibold text-gray-900"><MessageSquare :size="22" />{{ store.answeredCount }}</p>
              <p class="text-xs text-gray-500">Respondidas</p>
            </div>
            <div>
              <p class="flex items-center gap-1.5 text-3xl font-semibold text-green-600"><CircleCheck :size="22" />{{ store.correctCount }}</p>
              <p class="text-xs text-gray-500">Correctas</p>
            </div>
            <div>
              <p class="flex items-center gap-1.5 text-3xl font-semibold text-red-600"><XCircle :size="22" />{{ store.answeredCount - store.correctCount }}</p>
              <p class="text-xs text-gray-500">Incorrectas</p>
            </div>
            <div>
              <p class="flex items-center gap-1.5 text-3xl font-semibold text-blue-500"><XCircle :size="22" />{{ store.total - store.answeredCount }}</p>
              <p class="text-xs text-gray-500">No contestadas</p>
            </div>
          </div>
        </div>

        <div class="min-w-0 rounded-xl border border-gray-100 p-4 text-center">
          <h3 class="flex items-center gap-1.5 text-sm font-medium text-gray-700">
            <PieChart :size="16" /> Aciertos generales
          </h3>
          <svg viewBox="0 0 100 100" class="mx-auto mt-6 h-48 w-48">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#ef4444" stroke-width="14" />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#16a34a"
              stroke-width="14"
              :stroke-dasharray="`${store.successRatio * DONUT_CIRCUMFERENCE} ${DONUT_CIRCUMFERENCE - store.successRatio * DONUT_CIRCUMFERENCE}`"
              :stroke-dashoffset="DONUT_CIRCUMFERENCE / 4"
              stroke-linecap="round"
            />
            <text x="50" y="50" text-anchor="middle" class="fill-green-600 text-[20px] font-semibold">
              {{ Math.round(store.successRatio * 100) }}%
            </text>
            <text x="50" y="64" text-anchor="middle" class="fill-red-500 text-[12px] font-semibold">
              {{ Math.round((1 - store.successRatio) * 100) }}%
            </text>
          </svg>
          <div class="mt-3 flex justify-center gap-4 text-[10px] text-gray-500">
            <span class="flex items-center gap-1"><span class="h-2 w-2 rounded-full bg-green-600" />Correctas</span>
            <span class="flex items-center gap-1"><span class="h-2 w-2 rounded-full bg-red-500" />Incorrectas</span>
          </div>
        </div>

        <div class="min-w-0 rounded-xl border border-gray-100 p-4">
          <h3 class="flex items-center gap-1.5 text-sm font-medium text-gray-700">
            <BarChart3 :size="16" /> Aciertos por materia
          </h3>
          <div class="mt-2 flex gap-3 text-[10px] text-gray-500">
            <span class="flex items-center gap-1"><span class="h-2 w-2 rounded-full bg-green-500" />Aciertos</span>
            <span class="flex items-center gap-1"><span class="h-2 w-2 rounded-full bg-red-500" />Fallas</span>
            <span class="flex items-center gap-1"><span class="h-2 w-2 rounded-full bg-blue-400" />No contestadas</span>
          </div>
          <ul class="mt-3 gap-x-8 gap-y-2 lg:columns-2">
            <li v-for="item in store.byCategory" :key="item.name" class="break-inside-avoid">
              <div class="flex items-baseline justify-between gap-2 text-xs">
                <span class="truncate font-medium text-gray-700">{{ item.name }}</span>
                <span class="text-gray-500">{{ item.correct }}/{{ item.total }}</span>
              </div>
              <div class="mt-0.5 flex h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div class="bg-green-500" :style="{ width: `${item.total > 0 ? (item.correct / item.total) * 100 : 0}%` }" />
                <div class="bg-red-500" :style="{ width: `${item.total > 0 ? (item.incorrect / item.total) * 100 : 0}%` }" />
                <div class="bg-blue-400" :style="{ width: `${item.total > 0 ? (item.unanswered / item.total) * 100 : 0}%` }" />
              </div>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <section v-else class="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-xl ring-1 ring-gray-100">
      <h2 class="text-lg font-semibold text-gray-900">Instrucciones del examen</h2>
      <ul class="mt-4 space-y-2 text-left text-sm text-gray-600">
        <li>• Responderás <b>{{ QUESTION_COUNT }} preguntas aleatorias</b>, una a la vez.</li>
        <li>• Tiempo límite: <b>{{ Math.floor(TIME_LIMIT_SECONDS / 60) }} minutos</b>.</li>
        <li>• Solo se autoriza usar el <b>mouse</b> para seleccionar.</li>
        <li>• <b>Presionar cualquier tecla</b> o <b>cambiar de pestaña</b> finalizará el examen.</li>
      </ul>
      <p v-if="store.loadError" class="mt-4 text-sm text-red-600">{{ store.loadError }}</p>
      <div class="mt-6 flex justify-end gap-3">
        <button class="rounded-full border border-gray-200 px-5 py-2 text-sm text-gray-700" @click="router.push('/')">
          <ArrowLeft :size="16" class="mr-1 inline-block" /> Volver
        </button>
        <button class="rounded-full bg-gray-900 px-5 py-2 text-sm font-medium text-white disabled:opacity-50" :disabled="store.loadingQuestions" @click="store.startExam">
          <Play :size="16" class="mr-1 inline-block" /> {{ store.loadingQuestions ? 'Cargando…' : 'Comenzar examen' }}
        </button>
      </div>
    </section>
  </main>
</template>
