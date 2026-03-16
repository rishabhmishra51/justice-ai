const router = require('express').Router();
const { Op } = require('sequelize');
const auth   = require('../middleware/auth');
const { Suspect, Case, SuspectRelation } = require('../models');

router.get('/', auth, async (req, res) => {
  try {
    const { status, risk_level, search, page = 1, limit = 10 } = req.query;
    const where = {};
    if (status)     where.status     = status;
    if (risk_level) where.risk_level = risk_level;
    if (search)     where.name       = { [Op.like]: `%${search}%` };

    const { count, rows } = await Suspect.findAndCountAll({
      where,
      include: [{ model: Case, through: { attributes: [] }, attributes: ['id', 'case_number', 'title', 'status'] }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });
    res.json({ success: true, total: count, data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const s = await Suspect.findByPk(req.params.id, {
      include: [{ model: Case, through: { attributes: ['role'] } }]
    });
    if (!s) return res.status(404).json({ success: false, message: 'Suspect not found' });
    res.json({ success: true, data: s });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const s = await Suspect.create(req.body);
    res.status(201).json({ success: true, data: s });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const s = await Suspect.findByPk(req.params.id);
    if (!s) return res.status(404).json({ success: false, message: 'Not found' });
    await s.update(req.body);
    res.json({ success: true, data: s });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await Suspect.destroy({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Suspect deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Add relation between suspects (graph edge)
router.post('/:id/relations', auth, async (req, res) => {
  try {
    const { related_suspect_id, relation_type, strength, notes } = req.body;
    await SuspectRelation.create({
      suspect_id: req.params.id,
      related_suspect_id,
      relation_type: relation_type || 'associate',
      strength: strength || 1.0,
      notes
    });
    // Create reverse relation too
    await SuspectRelation.create({
      suspect_id: related_suspect_id,
      related_suspect_id: req.params.id,
      relation_type: relation_type || 'associate',
      strength: strength || 1.0,
      notes
    });
    res.json({ success: true, message: 'Relation created' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
