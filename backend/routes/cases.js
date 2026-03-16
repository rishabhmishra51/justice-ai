const router  = require('express').Router();
const { Op }  = require('sequelize');
const auth    = require('../middleware/auth');
const { Case, Suspect, Evidence, User } = require('../models');

// GET all cases
router.get('/', auth, async (req, res) => {
  try {
    const { status, priority, search, page = 1, limit = 10 } = req.query;
    const where = {};
    if (status)   where.status   = status;
    if (priority) where.priority = priority;
    if (search)   where.title    = { [Op.like]: `%${search}%` };

    const { count, rows } = await Case.findAndCountAll({
      where,
      include: [
        { model: Suspect, through: { attributes: [] }, attributes: ['id', 'name', 'risk_level'] },
        { model: User, as: 'creator', attributes: ['id', 'name'] }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });
    res.json({ success: true, total: count, page: parseInt(page), data: rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET single case
router.get('/:id', auth, async (req, res) => {
  try {
    const c = await Case.findByPk(req.params.id, {
      include: [
        { model: Suspect, through: { attributes: ['role', 'notes'] } },
        { model: Evidence },
        { model: User, as: 'creator', attributes: ['id', 'name'] }
      ]
    });
    if (!c) return res.status(404).json({ success: false, message: 'Case not found' });
    res.json({ success: true, data: c });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// CREATE case
router.post('/', auth, async (req, res) => {
  try {
    const caseData = { ...req.body, created_by: req.user.id };
    const c = await Case.create(caseData);
    res.status(201).json({ success: true, data: c });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// UPDATE case
router.put('/:id', auth, async (req, res) => {
  try {
    const c = await Case.findByPk(req.params.id);
    if (!c) return res.status(404).json({ success: false, message: 'Case not found' });
    await c.update(req.body);
    res.json({ success: true, data: c });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE case
router.delete('/:id', auth, async (req, res) => {
  try {
    const c = await Case.findByPk(req.params.id);
    if (!c) return res.status(404).json({ success: false, message: 'Case not found' });
    await c.destroy();
    res.json({ success: true, message: 'Case deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Add suspect to case
router.post('/:id/suspects', auth, async (req, res) => {
  try {
    const c = await Case.findByPk(req.params.id);
    const s = await Suspect.findByPk(req.body.suspect_id);
    if (!c || !s) return res.status(404).json({ success: false, message: 'Not found' });
    await c.addSuspect(s, { through: { role: req.body.role || 'suspect', notes: req.body.notes } });
    res.json({ success: true, message: 'Suspect linked to case' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
