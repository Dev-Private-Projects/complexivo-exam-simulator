import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { getCategories, getQuestions } from '@/services/question.service'
import type { Category } from '@/types/category'
import type { Question } from '@/types/question'

const PAGE_SIZE = 10

export const useQuestionStore = defineStore('question', () => {
  const categories = ref<Category[]>([])
  const questions = ref<Question[]>([])
  const selectedCategoryIds = ref<number[]>([])
  const searchQuery = ref('')
  const currentPage = ref(1)
  const categoriesLoading = ref(false)
  const questionsLoading = ref(false)
  const categoriesError = ref<string | null>(null)
  const questionsError = ref<string | null>(null)

  const totalPages = computed(() => Math.max(1, Math.ceil(questions.value.length / PAGE_SIZE)))

  const pageQuestions = computed(() =>
    questions.value.slice((currentPage.value - 1) * PAGE_SIZE, currentPage.value * PAGE_SIZE),
  )

  const loadCategories = async () => {
    categoriesLoading.value = true
    categoriesError.value = null
    try {
      categories.value = await getCategories()
    } catch (error) {
      categoriesError.value = error instanceof Error ? error.message : 'Error al cargar las categorías'
    } finally {
      categoriesLoading.value = false
    }
  }

  const loadQuestions = async () => {
    questionsLoading.value = true
    questionsError.value = null
    try {
      questions.value = await getQuestions(selectedCategoryIds.value, searchQuery.value)
    } catch (error) {
      questionsError.value = error instanceof Error ? error.message : 'Error al cargar las preguntas'
      questions.value = []
    } finally {
      questionsLoading.value = false
    }
  }

  const setCategories = (ids: number[]) => {
    selectedCategoryIds.value = ids
    currentPage.value = 1
    void loadQuestions()
  }

  const setSearch = (value: string) => {
    searchQuery.value = value
    currentPage.value = 1
    void loadQuestions()
  }

  const goToPage = (page: number) => {
    currentPage.value = Math.min(Math.max(1, page), totalPages.value)
  }

  return {
    categories,
    questions,
    pageQuestions,
    totalPages,
    currentPage,
    searchQuery,
    selectedCategoryIds,
    categoriesLoading,
    questionsLoading,
    categoriesError,
    questionsError,
    loadCategories,
    loadQuestions,
    setCategories,
    setSearch,
    goToPage,
  }
})
