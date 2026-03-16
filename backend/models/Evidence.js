const { DataTypes } = require('sequelize');

const Evidence = (sequelize) => sequelize.define('Evidence', {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  case_id:     { type: DataTypes.UUID, allowNull: false },
  title:       { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  type:        { type: DataTypes.ENUM('document','physical','digital','testimony','forensic'), defaultValue: 'document' },
  file_url:    { type: DataTypes.STRING },
  collected_at:{ type: DataTypes.DATE },
  collected_by:{ type: DataTypes.STRING },
  chain_of_custody: { type: DataTypes.TEXT },
  is_verified: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { tableName: 'evidence', timestamps: true, underscored: true });

module.exports = Evidence;
