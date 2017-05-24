import dotenv from 'dotenv';

dotenv.config();

let eVars = {
    BASE_URL: process.env.BASE_URL,
    ENV: process.env.ENV,
    PORT: process.env.PORT,
    SYS_REF: process.env.SYS_REF,
    PASS_PHRASE: process.env.PASS_PHRASE,
    VALIDATE: process.env.VALIDATE,
    TIMEZONE: process.env.TIMEZONE,
    AUTO_AUTHORIZED_SYSTEMS: process.env.AUTO_AUTHORIZED_SYSTEMS
};

module.exports = eVars;
