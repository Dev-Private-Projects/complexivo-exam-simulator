import { Router } from 'express';
import config from '../config/config.js';
import { sendError, sendSuccess } from '../utils/response.js';

const router = Router();

type Body = {
    pregunta: string;
    opcionSeleccionada: string;
    opcionCorrecta: string;
    esCorrecta: boolean;
};

router.post('/ai/explicacion', async (req, res, next) => {
    try {
        const { pregunta, opcionSeleccionada, opcionCorrecta, esCorrecta } = req.body as Body;

        if (
            !pregunta ||
            !opcionSeleccionada ||
            !opcionCorrecta ||
            typeof esCorrecta !== 'boolean'
        ) {
            return sendError(res, 'Faltan campos requeridos', 400);
        }

        if (!config.geminiApiKey) {
            return sendError(res, 'GEMINI_API_KEY no configurada', 503);
        }

        const prompt = `Eres un tutor de un examen. Recibis una pregunta, la opción elegida por el estudiante y la opción correcta. Responde en español, en 2 o 3 oraciones cortas, explicando por qué la opción elegida es ${esCorrecta ? 'correcta' : 'incorrecta'} en relación con la correcta.\n\nPregunta: ${pregunta}\nOpción elegida: ${opcionSeleccionada}\nOpción correcta: ${opcionCorrecta}\nÉscorrecta: ${esCorrecta}`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${config.geminiApiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                }),
            },
        );

        if (!response.ok) {
            const detail = await response.text();
            return sendError(res, `Gemini devolvió un error: ${detail}`, 502);
        }

        const data = await response.json();
        const explanation =
            data?.candidates?.[0]?.content?.parts?.[0]?.text ?? 'No se obtuvo explicación.';

        return sendSuccess(res, 'Explicación generada', { explanation: explanation.trim() });
    } catch (error) {
        next(error);
    }
});

export default router;
