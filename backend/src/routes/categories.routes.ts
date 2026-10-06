import { Router } from 'express';
import db from '../db/index.js';
import { categories } from '../db/schema.js';
import { sendSuccess } from '../utils/response.js';

const router = Router();

router.get('/categories', async (_req, res, next) => {
    try {
        const rows = await db
            .select({ id: categories.id, name: categories.name })
            .from(categories)
            .orderBy(categories.id);

        return sendSuccess(res, 'Categorías obtenidas correctamente', rows);
    } catch (error) {
        next(error);
    }
});

export default router;
