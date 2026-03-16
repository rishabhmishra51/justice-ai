"""
Justice AI - Python AI Microservice
Handles document embeddings, semantic search, and graph analytics
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os, re
from collections import defaultdict, deque

app = FastAPI(title="Justice AI Python Service", version="1.0.0")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


# ─── Models ───────────────────────────────────────────────────────────────────

class TextRequest(BaseModel):
    text: str
    max_length: int = 500

class GraphRequest(BaseModel):
    nodes: List[dict]
    edges: List[dict]
    start_node: str
    algorithm: str = "bfs"  # bfs | dfs
    max_depth: int = 3

class PathRequest(BaseModel):
    nodes: List[dict]
    edges: List[dict]
    start: str
    end: str


# ─── Utilities ────────────────────────────────────────────────────────────────

def build_adjacency(edges):
    adj = defaultdict(list)
    for e in edges:
        adj[e['from']].append({'id': e['to'], 'type': e.get('type', 'related'), 'label': e.get('label', '')})
        if e.get('bidirectional', True):
            adj[e['to']].append({'id': e['from'], 'type': e.get('type', 'related'), 'label': e.get('label', '')})
    return adj


# ─── BFS Algorithm ────────────────────────────────────────────────────────────

def bfs(adj, start, max_depth=3):
    visited = {start}
    queue = deque([(start, 0, [start])])
    result = []

    while queue:
        node, depth, path = queue.popleft()
        if depth > 0:
            result.append({'node': node, 'depth': depth, 'path': path})
        if depth < max_depth:
            for neighbor in adj.get(node, []):
                if neighbor['id'] not in visited:
                    visited.add(neighbor['id'])
                    queue.append((neighbor['id'], depth + 1, path + [neighbor['id']]))
    return result


# ─── DFS Algorithm ────────────────────────────────────────────────────────────

def dfs_paths(adj, start, end, max_depth=5):
    all_paths = []
    def dfs(current, target, path, visited, depth):
        if depth > max_depth: return
        if current == target:
            all_paths.append(list(path))
            return
        for neighbor in adj.get(current, []):
            if neighbor['id'] not in visited:
                visited.add(neighbor['id'])
                path.append(neighbor['id'])
                dfs(neighbor['id'], target, path, visited, depth + 1)
                path.pop()
                visited.remove(neighbor['id'])
    dfs(start, end, [start], {start}, 0)
    return all_paths


# ─── Clustering (Connected Components) ────────────────────────────────────────

def detect_clusters(adj, all_nodes):
    visited = set()
    clusters = []

    def dfs_cluster(node, cluster):
        visited.add(node)
        cluster.append(node)
        for neighbor in adj.get(node, []):
            if neighbor['id'] not in visited:
                dfs_cluster(neighbor['id'], cluster)

    for node in all_nodes:
        if node not in visited:
            cluster = []
            dfs_cluster(node, cluster)
            if len(cluster) > 1:
                clusters.append(cluster)

    return clusters


# ─── Simple NLP: Keyword Extraction ───────────────────────────────────────────

def extract_keywords(text: str, top_n: int = 10) -> List[str]:
    stop_words = {'the','a','an','in','is','it','of','and','to','that','was','he','she',
                  'they','this','are','for','at','from','by','with','as','his','her'}
    words = re.findall(r'\b[a-zA-Z]{4,}\b', text.lower())
    freq = defaultdict(int)
    for w in words:
        if w not in stop_words:
            freq[w] += 1
    return [w for w, _ in sorted(freq.items(), key=lambda x: -x[1])[:top_n]]


# ─── Routes ───────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "service": "Justice AI Python"}


@app.post("/graph/traverse")
def graph_traverse(req: GraphRequest):
    adj = build_adjacency(req.edges)
    if req.algorithm == "bfs":
        result = bfs(adj, req.start_node, req.max_depth)
    else:
        result = []
        for node in [n['id'] for n in req.nodes if n['id'] != req.start_node]:
            paths = dfs_paths(adj, req.start_node, node, req.max_depth)
            if paths:
                result.append({"node": node, "paths": paths})
    return {"algorithm": req.algorithm, "start": req.start_node, "results": result}


@app.post("/graph/path")
def find_path(req: PathRequest):
    adj = build_adjacency(req.edges)
    paths = dfs_paths(adj, req.start, req.end)
    return {"from": req.start, "to": req.end, "paths": paths, "found": len(paths) > 0}


@app.post("/graph/clusters")
def find_clusters(req: GraphRequest):
    adj = build_adjacency(req.edges)
    all_node_ids = [n['id'] for n in req.nodes]
    clusters = detect_clusters(adj, all_node_ids)
    node_map = {n['id']: n for n in req.nodes}
    return {
        "clusters": [
            {"id": i+1, "size": len(c), "members": [node_map.get(nid, {"id": nid}) for nid in c]}
            for i, c in enumerate(clusters)
        ],
        "total": len(clusters)
    }


@app.post("/nlp/keywords")
def keywords(req: TextRequest):
    kw = extract_keywords(req.text)
    return {"keywords": kw, "count": len(kw)}


@app.post("/nlp/entities")
def extract_entities(req: TextRequest):
    """Simple rule-based NER for legal documents"""
    text = req.text
    # Dates
    dates = re.findall(r'\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{1,2},?\s+\d{4}\b', text)
    # Case numbers
    case_nums = re.findall(r'\bCase\s*(?:No\.?|#)?\s*[\w/-]+\b', text, re.IGNORECASE)
    # IPC sections
    ipc = re.findall(r'\bSection\s+\d+[A-Z]?\b|\bIPC\s+\d+\b', text, re.IGNORECASE)
    # Money amounts
    amounts = re.findall(r'(?:Rs\.?|INR|₹)\s*[\d,]+(?:\.\d{2})?', text)
    return {"dates": dates, "case_numbers": case_nums, "legal_sections": ipc, "amounts": amounts}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
