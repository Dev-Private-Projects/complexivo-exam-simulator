import { Router } from 'express';
import { and, eq, ilike, inArray } from 'drizzle-orm';
import db from '../db/index.js';
import { categories, questionOptions, questions } from '../db/schema.js';
import { sendError, sendSuccess } from '../utils/response.js';

const router = Router();

router.get('/questions', async (req, res, next) => {
    try {
        const { categoryId, search } = req.query;

        let categoryIds: number[] | undefined;
        if (categoryId !== undefined && categoryId !== '') {
            const rawValues = Array.isArray(categoryId) ? categoryId : [categoryId];
            const parsed = (rawValues as string[])
                .flatMap((value) => value.split(','))
                .map((value) => Number(value));

            if (parsed.some((value) => !Number.isInteger(value) || value < 1)) {
                return sendError(res, 'El parámetro categoryId debe ser un entero positivo', 400);
            }
            categoryIds = parsed;
        }

        if (categoryIds !== undefined) {
            const existing = await db
                .select({ id: categories.id })
                .from(categories)
                .where(inArray(categories.id, categoryIds));

            const existingIds = new Set(existing.map((c) => c.id));
            const missing = categoryIds.find((id) => !existingIds.has(id));
            if (missing !== undefined) {
                return sendError(res, 'Categoría no encontrada', 404);
            }
        }

        const conditions = [];
        if (categoryIds !== undefined) {
            conditions.push(inArray(questions.categoryId, categoryIds));
        }
        const searched = typeof search === 'string' ? search.trim() : '';
        if (searched !== '') {
            conditions.push(ilike(questions.statement, `%${searched}%`));
        }
        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const questionRows = await db
            .select({
                id: questions.id,
                statement: questions.statement,
                categoryId: questions.categoryId,
                categoryName: categories.name,
            })
            .from(questions)
            .innerJoin(categories, eq(questions.categoryId, categories.id))
            .where(whereClause)
            .orderBy(questions.id);

        const questionIds = questionRows.map((question) => question.id);

        const optionRows =
            questionIds.length === 0
                ? []
                : await db
                      .select({
                          id: questionOptions.id,
                          questionId: questionOptions.questionId,
                          text: questionOptions.text,
                          position: questionOptions.position,
                          isCorrect: questionOptions.isCorrect,
                      })
                      .from(questionOptions)
                      .where(inArray(questionOptions.questionId, questionIds))
                      .orderBy(questionOptions.questionId, questionOptions.position);

        const optionsByQuestion = new Map<number, typeof optionRows>();
        for (const option of optionRows) {
            const list = optionsByQuestion.get(option.questionId) ?? [];
            list.push(option);
            optionsByQuestion.set(option.questionId, list);
        }

        const data = questionRows.map((question) => ({
            id: question.id,
            category: { id: question.categoryId, name: question.categoryName },
            statement: question.statement,
            options: (optionsByQuestion.get(question.id) ?? []).map((option) => ({
                id: option.id,
                text: option.text,
                position: option.position,
                isCorrect: option.isCorrect,
            })),
        }));

        return sendSuccess(res, 'Preguntas obtenidas correctamente', data);
    } catch (error) {
        next(error);
    }
});

export default router;
