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

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent`;
const MAX_ATTEMPTS = 3;
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

const buildPrompt = (pregunta: string, opcionSeleccionada: string, opcionCorrecta: string, esCorrecta: boolean) =>
    esCorrecta
        ? `Eres un tutor de un examen. Recibis una pregunta, la opción elegida por el estudiante y la opción correcta. Responde en español, en 2 o 3 oraciones cortas, explicando por qué la opción elegida es correcta en relación con la correcta.\n\nPregunta: ${pregunta}\nOpción elegida: ${opcionSeleccionada}\nOpción correcta: ${opcionCorrecta}\nÉscorrecta: ${esCorrecta}`
        : `Eres un tutor de un examen. El estudiante eligió una opción incorrecta. Explica en español, en 2 o 3 oraciones cortas, por qué la opción que eligió es incorrecta y cuál es el razonamiento correcto que lleva a la opción correcta. Comienza por el error cometido, no por la respuesta correcta. Nunca digas que la respuesta del estudiante es correcta ni que hay confusión. No repitas textualmente la pregunta.\n\nPregunta: ${pregunta}\nOpción elegida por el estudiante: ${opcionSeleccionada}\nOpción correcta: ${opcionCorrecta}`;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const requestGemini = async (prompt: string): Promise<string> => {
    let lastDetail = 'Sin detalle';

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        const response = await fetch(`${GEMINI_URL}?key=${config.geminiApiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
            }),
        });

        if (response.ok) {
            const data = await response.json();
            const explanation = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (typeof explanation === 'string' && explanation.trim().length > 0) {
                return explanation.trim();
            }
            lastDetail = 'La IA devolvió una respuesta vacía';
            break;
        }

        lastDetail = await response.text();

        if (!RETRYABLE_STATUS.has(response.status) || attempt === MAX_ATTEMPTS) {
            break;
        }

        await sleep(1000 * 2 ** (attempt - 1));
    }

    throw new Error(lastDetail);
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

        const prompt = buildPrompt(pregunta, opcionSeleccionada, opcionCorrecta, esCorrecta);
        const explanation = await requestGemini(prompt);

        return sendSuccess(res, 'Explicación generada', { explanation });
    } catch (error) {
        const detail = error instanceof Error ? error.message : 'Error desconocido';
        return sendError(res, `Gemini devolvió un error: ${detail}`, 502);
    }
});

export default router;
