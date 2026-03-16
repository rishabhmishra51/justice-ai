const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'justice_ai',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 }
  }
);

// Import models
const User     = require('./User')(sequelize);
const Case     = require('./Case')(sequelize);
const Suspect  = require('./Suspect')(sequelize);
const Evidence = require('./Evidence')(sequelize);
const CaseSuspect = require('./CaseSuspect')(sequelize);
const SuspectRelation = require('./SuspectRelation')(sequelize);

// Associations
Case.belongsToMany(Suspect, { through: CaseSuspect, foreignKey: 'case_id' });
Suspect.belongsToMany(Case, { through: CaseSuspect, foreignKey: 'suspect_id' });

Evidence.belongsTo(Case, { foreignKey: 'case_id' });
Case.hasMany(Evidence, { foreignKey: 'case_id' });

// Suspect relationships (graph edges)
Suspect.belongsToMany(Suspect, {
  through: SuspectRelation,
  as: 'relatedSuspects',
  foreignKey: 'suspect_id',
  otherKey: 'related_suspect_id'
});

Case.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
User.hasMany(Case, { foreignKey: 'created_by' });

module.exports = {
  sequelize,
  User,
  Case,
  Suspect,
  Evidence,
  CaseSuspect,
  SuspectRelation
};
