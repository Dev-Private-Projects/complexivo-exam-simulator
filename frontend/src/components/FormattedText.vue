<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ text: string }>()

type Segment = { text: string; kind: 'text' | 'sup' | 'sub' }

const segments = computed<Segment[]>(() => {
  const out: Segment[] = []
  const parts = props.text.split(/(\^[^\^]+\^|_[^_]+_)/g)
  for (const part of parts) {
    if (!part) continue
    if (/^\^[^\^]+\^$/.test(part)) {
      out.push({ text: part.slice(1, -1), kind: 'sup' })
    } else if (/^_[^_]+_$/.test(part)) {
      out.push({ text: part.slice(1, -1), kind: 'sub' })
    } else {
      out.push({ text: part, kind: 'text' })
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
      <template v-else>{{ segment.text }}</template>
    </template>
  </span>
</template>
