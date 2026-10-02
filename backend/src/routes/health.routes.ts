import { Router } from 'express';
import { sendSuccess } from '../utils/response.js';

const router = Router();

router.get('/health', (_req, res) => {
    return sendSuccess(
        res,
        'API funcionando correctamente',
        {
            status: 'ok',
        },
    );
});

export default router;