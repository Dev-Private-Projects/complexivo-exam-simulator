import express from 'express';
import corsMiddleware from './middlewares/cors.middleware.js';
import routes from './routes/index.js';
import errorMiddleware from './middlewares/error.middleware.js';

const app = express();

app.use(corsMiddleware);
app.use(express.json());

app.use('/api', routes);

app.use(errorMiddleware);

export default app;