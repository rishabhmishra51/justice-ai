const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Case', {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  case_number: { type: DataTypes.STRING, unique: true },
  title:       { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  status:      { type: DataTypes.ENUM('open','active','closed','pending'), defaultValue: 'open' },
  priority:    { type: DataTypes.ENUM('low','medium','high','critical'), defaultValue: 'medium' },
  jurisdiction:{ type: DataTypes.STRING },
  category:    { type: DataTypes.STRING },
  verdict:     { type: DataTypes.TEXT },
  ai_summary:  { type: DataTypes.TEXT },
  filed_date:  { type: DataTypes.DATEONLY },
  closed_date: { type: DataTypes.DATEONLY },
  created_by:  { type: DataTypes.UUID }
}, { tableName: 'cases', timestamps: true, underscored: true,
  hooks: {
    beforeCreate: async (c) => {
      if (!c.case_number) {
        const uniqueSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
        c.case_number = 'CASE-' + Date.now().toString(36).toUpperCase() + '-' + uniqueSuffix;
      }
    }
  }
});
