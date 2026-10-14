<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ text: string }>()

type Segment = { text: string; kind: 'text' | 'sup' | 'sub' | 'blank' | 'highlight' | 'italic' }

const segments = computed<Segment[]>(() => {
  const out: Segment[] = []
  // Primero separamos los blancos (3 o más guiones seguidos) para que no
  // se confundan con el formato de subíndice _..._
  const chunks = props.text.split(/(\_{3,})/g)
  for (const chunk of chunks) {
    if (!chunk) continue
    if (/^\_{3,}$/.test(chunk)) {
      out.push({ text: chunk, kind: 'blank' })
      continue
    }
    const parts = chunk.split(/(\*\*[^*]+\*\*|\*[^*]+\*|\^[^\^]+\^|_[^_]+_)/g)
    for (const part of parts) {
      if (!part) continue
      if (/^\*\*[^*]+\*\*$/.test(part)) {
        out.push({ text: part.slice(2, -2), kind: 'highlight' })
      } else if (/^\*[^*]+\*$/.test(part)) {
        out.push({ text: part.slice(1, -1), kind: 'italic' })
      } else if (/^\^[^\^]+\^$/.test(part)) {
        out.push({ text: part.slice(1, -1), kind: 'sup' })
      } else if (/^_[^_]+_$/.test(part)) {
        out.push({ text: part.slice(1, -1), kind: 'sub' })
      } else {
        out.push({ text: part, kind: 'text' })
      }
    }
  }
  return out
})
</script>

<template>
  <span>
    <template v-for="(segment, i) in segments" :key="i">
      <sup v-if="segment.kind === 'sup'">{{ segment.text }}</sup>
      <sub v-else-if="segment.kind === 'sub'">{{ segment.text }}</sub>
      <strong v-else-if="segment.kind === 'highlight'" class="font-semibold text-blue-600">{{ segment.text }}</strong>
      <em v-else-if="segment.kind === 'italic'">{{ segment.text }}</em>
      <template v-else>{{ segment.text }}</template>
    </template>
  </span>
</template>
