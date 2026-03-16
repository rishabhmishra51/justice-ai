/**
 * Justice AI - Graph Theory Engine
 * Implements BFS/DFS for suspect-case relationship discovery
 */

const { Suspect, Case, SuspectRelation, CaseSuspect, sequelize } = require('../models');

class GraphEngine {
  /**
   * Build adjacency graph from database
   */
  async buildGraph() {
    const suspects = await Suspect.findAll({ attributes: ['id', 'name', 'risk_level', 'status'] });
    const relations = await SuspectRelation.findAll();
    const caseSuspects = await CaseSuspect.findAll();
    const cases = await Case.findAll({ attributes: ['id', 'case_number', 'title', 'status'] });

    const nodes = {
      suspects: suspects.map(s => ({ id: s.id, label: s.name, type: 'suspect', risk: s.risk_level, status: s.status })),
      cases: cases.map(c => ({ id: c.id, label: c.case_number + ': ' + c.title, type: 'case', status: c.status }))
    };

    const edges = [
      ...relations.map(r => ({
        from: r.suspect_id,
        to: r.related_suspect_id,
        type: r.relation_type,
        strength: r.strength,
        label: r.relation_type
      })),
      ...caseSuspects.map(cs => ({
        from: cs.suspect_id,
        to: cs.case_id,
        type: 'involved_in',
        label: cs.role || 'suspect'
      }))
    ];

    return { nodes, edges };
  }

  /**
   * BFS: Find all suspects reachable from a given suspect within N hops
   */
  async bfsTraversal(startSuspectId, maxDepth = 3) {
    const relations = await SuspectRelation.findAll();
    
    // Build adjacency list
    const adj = {};
    relations.forEach(r => {
      if (!adj[r.suspect_id]) adj[r.suspect_id] = [];
      adj[r.suspect_id].push({ id: r.related_suspect_id, type: r.relation_type, strength: r.strength });
    });

    const visited = new Set();
    const queue = [{ id: startSuspectId, depth: 0, path: [startSuspectId] }];
    const result = [];
    visited.add(startSuspectId);

    while (queue.length > 0) {
      const { id, depth, path } = queue.shift();

      if (depth > 0) {
        result.push({ suspect_id: id, depth, path: [...path] });
      }

      if (depth < maxDepth && adj[id]) {
        for (const neighbor of adj[id]) {
          if (!visited.has(neighbor.id)) {
            visited.add(neighbor.id);
            queue.push({
              id: neighbor.id,
              depth: depth + 1,
              path: [...path, neighbor.id],
              relation: neighbor.type
            });
          }
        }
      }
    }

    // Hydrate with suspect details
    const suspectIds = result.map(r => r.suspect_id);
    const suspects = await Suspect.findAll({ where: { id: suspectIds } });
    const suspectMap = {};
    suspects.forEach(s => suspectMap[s.id] = s);

    return result.map(r => ({
      ...r,
      suspect: suspectMap[r.suspect_id] || null
    }));
  }

  /**
   * DFS: Find if a path exists between two suspects
   */
  async dfsPathFind(startId, targetId, maxDepth = 5) {
    const relations = await SuspectRelation.findAll();
    const adj = {};
    relations.forEach(r => {
      if (!adj[r.suspect_id]) adj[r.suspect_id] = [];
      adj[r.suspect_id].push({ id: r.related_suspect_id, type: r.relation_type });
    });

    const visited = new Set();
    const paths = [];

    const dfs = (current, target, path, depth) => {
      if (depth > maxDepth) return;
      if (current === target) {
        paths.push([...path]);
        return;
      }
      visited.add(current);
      const neighbors = adj[current] || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor.id)) {
          dfs(neighbor.id, target, [...path, { id: neighbor.id, via: neighbor.type }], depth + 1);
        }
      }
      visited.delete(current);
    };

    dfs(startId, targetId, [{ id: startId, via: 'start' }], 0);
    return paths;
  }

  /**
   * Find all cases linked through shared suspects
   */
  async findLinkedCases(caseId) {
    const caseSuspects = await CaseSuspect.findAll({ where: { case_id: caseId } });
    const suspectIds = caseSuspects.map(cs => cs.suspect_id);

    if (suspectIds.length === 0) return [];

    // Find other cases with these suspects
    const linkedCaseSuspects = await CaseSuspect.findAll({
      where: {
        suspect_id: suspectIds,
        case_id: { [require('sequelize').Op.ne]: caseId }
      }
    });

    const linkedCaseIds = [...new Set(linkedCaseSuspects.map(lcs => lcs.case_id))];
    const linkedCases = await Case.findAll({
      where: { id: linkedCaseIds },
      include: [{ model: Suspect, through: { attributes: [] } }]
    });

    return linkedCases.map(c => ({
      ...c.toJSON(),
      shared_suspects: suspectIds.filter(sid => c.Suspects?.some(s => s.id === sid)).length
    }));
  }

  /**
   * Detect criminal clusters using connected components
   */
  async detectClusters() {
    const suspects = await Suspect.findAll({ attributes: ['id', 'name', 'risk_level'] });
    const relations = await SuspectRelation.findAll();

    const adj = {};
    suspects.forEach(s => adj[s.id] = []);
    relations.forEach(r => {
      if (adj[r.suspect_id]) adj[r.suspect_id].push(r.related_suspect_id);
    });

    const visited = new Set();
    const clusters = [];

    const dfsCluster = (id, cluster) => {
      visited.add(id);
      cluster.push(id);
      (adj[id] || []).forEach(neighbor => {
        if (!visited.has(neighbor)) dfsCluster(neighbor, cluster);
      });
    };

    suspects.forEach(s => {
      if (!visited.has(s.id)) {
        const cluster = [];
        dfsCluster(s.id, cluster);
        if (cluster.length > 1) clusters.push(cluster);
      }
    });

    const suspectMap = {};
    suspects.forEach(s => suspectMap[s.id] = s);

    return clusters.map((cluster, idx) => ({
      cluster_id: idx + 1,
      size: cluster.length,
      members: cluster.map(id => suspectMap[id]).filter(Boolean),
      risk_score: cluster.reduce((acc, id) => {
        const risk = { low: 1, medium: 2, high: 3, critical: 4 };
        return acc + (risk[suspectMap[id]?.risk_level] || 0);
      }, 0) / cluster.length
    }));
  }
}

module.exports = new GraphEngine();
