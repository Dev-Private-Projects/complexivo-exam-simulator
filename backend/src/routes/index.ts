import {Router} from 'express';
import healthRoutes from './health.routes.js'
import categoriesRoutes from './categories.routes.js'
import questionsRoutes from './questions.routes.js'

const router = Router();

router.use(healthRoutes);
router.use(categoriesRoutes);
router.use(questionsRoutes);

export default router;