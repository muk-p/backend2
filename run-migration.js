require('dotenv').config();
const { Umzug, SequelizeStorage } = require('umzug');
const sequelize = require('./db.js');

const umzug = new Umzug({
    migrations: { glob: 'migrations/*.js' },
    context: sequelize,
    storage: new SequelizeStorage({ sequelize }),
    logger: console,
});

(async () => {
    await umzug.up();
})();
