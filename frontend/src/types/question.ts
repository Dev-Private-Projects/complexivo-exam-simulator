export type QuestionOption = {
  id: number
  text: string
  position: number
  isCorrect: boolean
}

export type Question = {
  id: number
  category: {
    id: number
    name: string
  }
  statement: string
  options: QuestionOption[]
}
