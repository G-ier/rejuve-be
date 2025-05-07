require('dotenv').config({ path: '../../.env' });

module.exports = {
    DATABASE_URL: process.env.DATABASE_URL,
    DATABASE_URL_LOCAL: process.env.DATABASE_URL_LOCAL
  };