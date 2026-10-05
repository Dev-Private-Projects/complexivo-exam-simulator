import { createRouter, createWebHistory } from 'vue-router'
import QuestionBankView from '@/views/QuestionBankView.vue'
import SimuladorView from '@/views/SimuladorView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: QuestionBankView,
    },
    {
      path: '/banco-de-preguntas',
      redirect: '/',
    },
    {
      path: '/simulador',
      component: SimuladorView,
    },
  ],
})

export default router
