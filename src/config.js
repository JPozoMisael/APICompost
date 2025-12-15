require('dotenv').config();

module.exports = {
    DB: {
        HOST: process.env.DB_HOST || 'localhost',
        PORT: process.env.DB_PORT || '3306',
        USER: process.env.DB_USER || 'root',
        PASSWORD: process.env.DB_PASSWORD || '',
        NAME: process.env.DB_NAME || 'appcompostdb',
    },
    JWT_SECRET : process.env.JWT_SECRET || 'default_jwt_secret',
};