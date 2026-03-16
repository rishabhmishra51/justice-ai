const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('SuspectRelation', {
  id:                 { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  suspect_id:         { type: DataTypes.UUID, allowNull: false },
  related_suspect_id: { type: DataTypes.UUID, allowNull: false },
  relation_type:      { type: DataTypes.STRING, defaultValue: 'associate' }, // associate, family, accomplice
  strength:           { type: DataTypes.FLOAT, defaultValue: 1.0 },
  notes:              { type: DataTypes.TEXT }
}, { tableName: 'suspect_relations', timestamps: true, underscored: true });
