import 'dotenv/config';

const {
    PORT = '3000',
    NODE_ENV = 'development',
    DATABASE_URL,
    CORS_ORIGIN,
} = process.env;

const port = Number(PORT);
const nodeEnv = NODE_ENV;

if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be a valid port number');
}

if (!['development', 'production'].includes(nodeEnv)) {
    throw new Error(
        'NODE_ENV must be development or production',
    );
}

if (!DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
}

let databaseUrl: URL;

try {
    databaseUrl = new URL(DATABASE_URL);
} catch {
    throw new Error('DATABASE_URL must be a valid URL');
}

if (!['postgresql:', 'postgres:'].includes(databaseUrl.protocol)) {
    throw new Error('DATABASE_URL must be a PostgreSQL connection string');
}

const config = {
    port,
    nodeEnv,
    databaseUrl: DATABASE_URL,
    corsOrigin: CORS_ORIGIN ?? 'http://localhost:5173',
};

export default config;