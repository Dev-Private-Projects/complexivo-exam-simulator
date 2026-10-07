import {Router} from 'express';
import healthRoutes from './health.routes.js'
import categoriesRoutes from './categories.routes.js'
import questionsRoutes from './questions.routes.js'
import aiRoutes from './ai.routes.js'

const router = Router();

router.use(healthRoutes);
router.use(categoriesRoutes);
router.use(questionsRoutes);
router.use(aiRoutes);

export default router;