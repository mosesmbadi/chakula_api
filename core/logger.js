const pino = require('pino');
const config = require('./config');

const isDev = config.nodeEnv !== 'production';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  base: { service: 'chakula-api', env: config.nodeEnv },
  ...(isDev && {
    transport: {
      target: require.resolve('pino-pretty'),
      options: { colorize: true, translateTime: 'SYS:standard', ignore: 'pid,hostname' },
    },
  }),
});

module.exports = logger;
