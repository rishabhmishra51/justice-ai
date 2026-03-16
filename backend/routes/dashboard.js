const router   = require('express').Router();
const auth     = require('../middleware/auth');
const { sequelize, Case, Suspect, Evidence } = require('../models');
const { fn, col } = require('sequelize');

router.get('/stats', auth, async (req, res) => {
  try {
    const [totalCases, totalSuspects, totalEvidence,
           openCases, closedCases, criticalCases,
           casesByStatus, suspectsByRisk] = await Promise.all([
      Case.count(),
      Suspect.count(),
      Evidence.count(),
      Case.count({ where: { status: 'open' } }),
      Case.count({ where: { status: 'closed' } }),
      Case.count({ where: { priority: 'critical' } }),
      Case.findAll({ attributes: ['status', [fn('COUNT', col('id')), 'count']], group: ['status'] }),
      Suspect.findAll({ attributes: ['risk_level', [fn('COUNT', col('id')), 'count']], group: ['risk_level'] })
    ]);

    // Recent cases
    const recentCases = await Case.findAll({
      order: [['created_at', 'DESC']],
      limit: 5,
      attributes: ['id', 'case_number', 'title', 'status', 'priority', 'created_at']
    });

    res.json({
      success: true,
      stats: {
        totalCases, totalSuspects, totalEvidence,
        openCases, closedCases, criticalCases,
        casesByStatus: casesByStatus.map(r => ({ status: r.status, count: parseInt(r.dataValues.count) })),
        suspectsByRisk: suspectsByRisk.map(r => ({ risk: r.risk_level, count: parseInt(r.dataValues.count) })),
        recentCases
      }
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
