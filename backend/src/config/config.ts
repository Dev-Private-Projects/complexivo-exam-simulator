import 'dotenv/config';

const {
    PORT = '3000',
    NODE_ENV = 'development',
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

const config = {
    port,
    nodeEnv,
};

export default config;