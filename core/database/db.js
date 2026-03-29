const { Pool } = require('pg');
const config = require('../config');

const pool = new Pool(config.postgres);

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err.message);
});

/**
 * Run a single parameterised query.
 */
const query = (text, params) => pool.query(text, params);

/**
 * Obtain a client for transactions.
 */
const getClient = () => pool.connect();

/**
 * Graceful shutdown.
 */
const close = () => pool.end();

module.exports = { pool, query, getClient, close };
