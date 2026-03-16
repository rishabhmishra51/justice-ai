const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('User', {
  id:       { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name:     { type: DataTypes.STRING, allowNull: false },
  email:    { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  role:     { type: DataTypes.ENUM('admin', 'investigator', 'analyst'), defaultValue: 'investigator' },
  avatar:   { type: DataTypes.STRING }
}, { tableName: 'users', timestamps: true, underscored: true });
