const { DataTypes } = require('sequelize');

const CaseSuspect = (sequelize) => sequelize.define('CaseSuspect', {
  id:         { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  case_id:    { type: DataTypes.UUID },
  suspect_id: { type: DataTypes.UUID },
  role:       { type: DataTypes.STRING, defaultValue: 'suspect' },
  notes:      { type: DataTypes.TEXT }
}, { tableName: 'case_suspects', timestamps: true, underscored: true });

module.exports = CaseSuspect;
