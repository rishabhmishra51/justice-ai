const router = require('express').Router();
const auth   = require('../middleware/auth');
const { Evidence } = require('../models');

router.get('/case/:caseId', auth, async (req, res) => {
  try {
    const evidence = await Evidence.findAll({ where: { case_id: req.params.caseId } });
    res.json({ success: true, data: evidence });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const e = await Evidence.create(req.body);
    res.status(201).json({ success: true, data: e });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const e = await Evidence.findByPk(req.params.id);
    if (!e) return res.status(404).json({ success: false, message: 'Not found' });
    await e.update(req.body);
    res.json({ success: true, data: e });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await Evidence.destroy({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Evidence deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
