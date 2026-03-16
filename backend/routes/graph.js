const router = require('express').Router();
const auth   = require('../middleware/auth');
const graph  = require('../graph/engine');

// Full graph data for visualization
router.get('/data', auth, async (req, res) => {
  try {
    const data = await graph.buildGraph();
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// BFS traversal from a suspect
router.get('/bfs/:suspectId', auth, async (req, res) => {
  try {
    const depth = parseInt(req.query.depth) || 3;
    const result = await graph.bfsTraversal(req.params.suspectId, depth);
    res.json({ success: true, start: req.params.suspectId, depth, connections: result });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// DFS path finding between two suspects
router.get('/path/:fromId/:toId', auth, async (req, res) => {
  try {
    const paths = await graph.dfsPathFind(req.params.fromId, req.params.toId);
    res.json({ success: true, paths, found: paths.length > 0 });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Find linked cases
router.get('/linked-cases/:caseId', auth, async (req, res) => {
  try {
    const linkedCases = await graph.findLinkedCases(req.params.caseId);
    res.json({ success: true, data: linkedCases });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Detect criminal clusters
router.get('/clusters', auth, async (req, res) => {
  try {
    const clusters = await graph.detectClusters();
    res.json({ success: true, data: clusters });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
