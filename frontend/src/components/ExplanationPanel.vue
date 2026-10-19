<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { Bot, Presentation } from '@lucide/vue'

const props = defineProps<{ text: string; open?: boolean; source?: 'ai' | 'doc' }>()

const isAi = computed(() => (props.source ?? 'ai') === 'ai')

const formatted = computed(() => {
  let t = props.text
  t = t.replace(/\\\[|\\\]/g, '\n')
  t = t.replace(/\\\(|\\\)/g, '')
  t = t.replace(/\$\$/g, '\n')
  t = t.replace(/\$/g, '')
  t = t.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
  t = t.replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
  t = t.replace(/\\int/g, '∫')
  t = t.replace(/\\sum/g, '∑')
  t = t.replace(/\\pi/g, 'π')
  t = t.replace(/\\infty/g, '∞')
  t = t.replace(/\\leq?/g, '≤')
  t = t.replace(/\\geq?/g, '≥')
  t = t.replace(/\\cdot/g, '·')
  t = t.replace(/\\times/g, '×')
  t = t.replace(/\\div/g, '÷')
  t = t.replace(/\\\\/g, '\n')
  return t.trim()
})

const displayed = ref('')
const visible = ref(false)
let timer: ReturnType<typeof setInterval> | null = null

const stopTimer = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

const startType = () => {
  stopTimer()
  displayed.value = ''
  let i = 0
  const target = formatted.value
  timer = setInterval(() => {
    if (i >= target.length) {
      stopTimer()
      return
    }
    displayed.value += target.charAt(i)
    i++
  }, 16)
}

const startErase = () => {
  stopTimer()
  timer = setInterval(() => {
    if (displayed.value.length === 0) {
      stopTimer()
      visible.value = false
      return
    }
    displayed.value = displayed.value.slice(0, -1)
  }, 12)
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      visible.value = true
      startType()
    } else if (visible.value) {
      startErase()
    }
  },
  { immediate: true },
)

watch(
  () => props.text,
  () => {
    if (props.open && visible.value) {
      startType()
    }
  },
)

onUnmounted(stopTimer)
</script>

<template>
  <div v-show="visible" class="mt-4 flex items-start gap-2.5">
    <span
      class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
      :class="isAi ? 'bg-blue-pen/10 text-blue-pen' : 'bg-pencil/10 text-pencil'"
    >
      <Bot v-if="isAi" :size="16" />
      <Presentation v-else :size="16" />
    </span>
    <div class="chat-bubble min-w-0 flex-1 px-4 py-3">
      <p class="note-text whitespace-pre-line text-sm leading-6 text-pencil">
        {{ displayed }}<span v-if="visible" class="animate-pulse">▍</span>
      </p>
    </div>
  </div>
</template>
