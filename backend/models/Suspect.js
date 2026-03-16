const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Suspect', {
  id:           { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name:         { type: DataTypes.STRING, allowNull: false },
  alias:        { type: DataTypes.STRING },
  dob:          { type: DataTypes.DATEONLY },
  nationality:  { type: DataTypes.STRING },
  address:      { type: DataTypes.TEXT },
  phone:        { type: DataTypes.STRING },
  email:        { type: DataTypes.STRING },
  occupation:   { type: DataTypes.STRING },
  criminal_record: { type: DataTypes.TEXT },
  risk_level:   { type: DataTypes.ENUM('low','medium','high','critical'), defaultValue: 'medium' },
  status:       { type: DataTypes.ENUM('active','arrested','acquitted','deceased'), defaultValue: 'active' },
  notes:        { type: DataTypes.TEXT },
  photo_url:    { type: DataTypes.STRING }
}, { tableName: 'suspects', timestamps: true, underscored: true });
