import cors from 'cors'
import config from '../config/config.js';

const corsMiddleware = cors({
  origin: config.corsOrigin,
})

export default corsMiddleware
