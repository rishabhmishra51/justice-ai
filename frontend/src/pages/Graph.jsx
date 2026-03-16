import { useState, useEffect, useRef } from 'react';
import { GitFork, Search, Layers, Network, AlertTriangle } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

// Simple Canvas-based graph renderer
function GraphCanvas({ nodes, edges }) {
  const canvasRef = useRef(null);
  const stateRef  = useRef({ nodes: [], dragging: null, offset: { x: 0, y: 0 }, scale: 1, pan: { x: 0, y: 0 } });

  useEffect(() => {
    if (!nodes.length) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;

    // Layout nodes in circles
    const allNodes = [...nodes.suspects, ...nodes.cases];
    const positioned = allNodes.map((n, i) => {
      const angle = (i / allNodes.length) * 2 * Math.PI;
      const radius = Math.min(W, H) * 0.35;
      return { ...n, x: W / 2 + radius * Math.cos(angle), y: H / 2 + radius * Math.sin(angle) };
    });
    stateRef.current.nodes = positioned;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#070b14';
      ctx.fillRect(0, 0, W, H);

      const nodeMap = {};
      positioned.forEach(n => nodeMap[n.id] = n);

      // Draw edges
      edges.forEach(e => {
        const from = nodeMap[e.from], to = nodeMap[e.to];
        if (!from || !to) return;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.strokeStyle = e.type === 'involved_in' ? 'rgba(59,130,246,0.4)' : 'rgba(201,162,39,0.3)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // Label
        ctx.fillStyle = 'rgba(139,153,181,0.7)';
        ctx.font = '9px DM Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(e.label || '', (from.x + to.x) / 2, (from.y + to.y) / 2 - 4);
      });

      // Draw nodes
      positioned.forEach(n => {
        const isSuspect = n.type === 'suspect';
        const riskColor = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e' };
        const color = isSuspect ? (riskColor[n.risk] || '#3b82f6') : '#06b6d4';
        const r = isSuspect ? 18 : 14;

        // Glow
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;

        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, 2 * Math.PI);
        ctx.fillStyle = color + '33';
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.shadowBlur = 0;

        // Icon letter
        ctx.fillStyle = color;
        ctx.font = `bold ${isSuspect ? 12 : 10}px Syne, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(n.label[0].toUpperCase(), n.x, n.y);

        // Label
        ctx.fillStyle = '#e8eaf0';
        ctx.font = '10px Crimson Pro, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        const label = n.label.length > 20 ? n.label.slice(0, 18) + '…' : n.label;
        ctx.fillText(label, n.x, n.y + r + 4);
      });
    };

    draw();
  }, [nodes, edges]);

  return <canvas ref={canvasRef} width={800} height={520}
    style={{ width: '100%', height: 520, borderRadius: 8, display: 'block' }} />;
}

export default function GraphPage() {
  const [graphData, setGraphData]   = useState({ nodes: { suspects: [], cases: [] }, edges: [] });
  const [clusters, setClusters]     = useState([]);
  const [bfsResult, setBfsResult]   = useState(null);
  const [suspects, setSuspects]     = useState([]);
  const [selectedS, setSelectedS]   = useState('');
  const [bfsDepth, setBfsDepth]     = useState(3);
  const [tab, setTab]               = useState('graph'); // graph | bfs | clusters
  const [loading, setLoading]       = useState(true);
  const [bfsLoading, setBfsLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/graph/data'),
      api.get('/suspects', { params: { limit: 100 } }),
    ]).then(([g, s]) => {
      setGraphData(g.data.data);
      setSuspects(s.data.data);
    }).finally(() => setLoading(false));
  }, []);

  const runBFS = async () => {
    if (!selectedS) return toast.error('Select a suspect');
    setBfsLoading(true);
    try {
      const { data } = await api.get(`/graph/bfs/${selectedS}`, { params: { depth: bfsDepth } });
      setBfsResult(data);
      setTab('bfs');
    } catch { toast.error('BFS failed'); }
    finally { setBfsLoading(false); }
  };

  const loadClusters = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/graph/clusters');
      setClusters(data.data);
      setTab('clusters');
    } finally { setLoading(false); }
  };

  const totalNodes = (graphData.nodes.suspects?.length || 0) + (graphData.nodes.cases?.length || 0);

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--accent-gold)', letterSpacing: '0.12em', marginBottom: 6 }}>◆ NETWORK ANALYSIS</div>
        <h1 style={{ fontSize: '1.6rem' }}>Criminal Network Graph</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>BFS/DFS-powered relationship mapping across cases and suspects</p>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        {[
          { label: 'Nodes', value: totalNodes, color: '#3b82f6' },
          { label: 'Edges', value: graphData.edges?.length || 0, color: '#c9a227' },
          { label: 'Suspects', value: graphData.nodes.suspects?.length || 0, color: '#f97316' },
          { label: 'Cases', value: graphData.nodes.cases?.length || 0, color: '#06b6d4' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card" style={{ padding: '12px 20px', flex: 1, textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, color }}>{value}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label>Start Suspect (BFS)</label>
          <select className="input" value={selectedS} onChange={e => setSelectedS(e.target.value)}>
            <option value="">Select suspect...</option>
            {suspects.map(s => <option key={s.id} value={s.id}>{s.name} [{s.risk_level}]</option>)}
          </select>
        </div>
        <div style={{ width: 120 }}>
          <label>Max Depth</label>
          <select className="input" value={bfsDepth} onChange={e => setBfsDepth(Number(e.target.value))}>
            {[1,2,3,4,5].map(d => <option key={d} value={d}>{d} hops</option>)}
          </select>
        </div>
        <button className="btn btn-primary" onClick={runBFS} disabled={bfsLoading}>
          {bfsLoading ? <><div className="loader" style={{ width: 14, height: 14 }} /> Running...</> : <><Search size={14} /> Run BFS</>}
        </button>
        <button className="btn btn-secondary" onClick={loadClusters}>
          <Layers size={14} /> Detect Clusters
        </button>
        <button className="btn btn-secondary" onClick={() => setTab('graph')}>
          <Network size={14} /> Full Graph
        </button>
      </div>

      {/* Tab content */}
      {tab === 'graph' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Network size={15} color="var(--accent-gold)" />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.9rem' }}>Full Network Graph</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 16 }}>
              {[['#f97316','Suspect'],['#06b6d4','Case'],['#c9a227','Relation'],['#3b82f6','Link']].map(([c,l]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-secondary)' }}>{l}</span>
                </div>
              ))}
            </div>
          </div>
          {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}><div className="loader" /></div>
            : <GraphCanvas nodes={graphData.nodes} edges={graphData.edges} />}
          {!totalNodes && !loading && (
            <div style={{ padding: '48px', textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              No data — add cases and suspects to visualize the network
            </div>
          )}
        </div>
      )}

      {tab === 'bfs' && bfsResult && (
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ marginBottom: 6, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Search size={15} color="var(--accent-gold)" /> BFS Results
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 20 }}>
            Found <strong>{bfsResult.connections?.length}</strong> connected suspects within <strong>{bfsResult.depth}</strong> hops
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {bfsResult.connections?.map((conn, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 8 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--accent-cyan)', width: 40 }}>
                  HOP {conn.depth}
                </div>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #f97316, #ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white', fontSize: '0.9rem' }}>
                  {conn.suspect?.name?.[0] || '?'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{conn.suspect?.name || conn.suspect_id}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Path: {conn.path?.length} nodes
                  </div>
                </div>
                {conn.suspect?.risk_level && <span className={`badge badge-${conn.suspect.risk_level}`}>{conn.suspect.risk_level}</span>}
              </div>
            ))}
            {!bfsResult.connections?.length && (
              <div style={{ textAlign: 'center', padding: 32, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                No connections found within {bfsResult.depth} hops
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'clusters' && (
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={16} color="var(--accent-gold)" /> Criminal Clusters ({clusters.length})
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {clusters.map(cluster => (
              <div key={cluster.cluster_id} className="card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--accent-gold)' }}>CLUSTER {cluster.cluster_id}</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800 }}>{cluster.size} members</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)' }}>Risk Score</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, color: cluster.risk_score > 2.5 ? '#ef4444' : cluster.risk_score > 1.5 ? '#f97316' : '#22c55e' }}>
                      {cluster.risk_score?.toFixed(1)}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {cluster.members?.map(m => (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, #f97316, #ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: 'white' }}>{m.name[0]}</div>
                      <span style={{ fontSize: '0.88rem' }}>{m.name}</span>
                      <span className={`badge badge-${m.risk_level}`} style={{ marginLeft: 'auto', fontSize: '0.6rem', padding: '1px 6px' }}>{m.risk_level}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {!clusters.length && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                No clusters detected — add suspect relationships to discover criminal networks
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
