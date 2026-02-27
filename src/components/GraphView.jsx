import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { lawData, allArticles } from '../data/lawData.js';
import { useUserDataContext } from '../hooks/useUserData.js';
import { colors } from '../styles/theme.js';

// Force-directed layout computation
function computeLayout(nodes, edges) {
  const W = 800, H = 800;
  const cx = W / 2, cy = H / 2;

  // Group by category for initial positions
  const categories = lawData.categories;
  const catPositions = {};
  categories.forEach((cat, i) => {
    const angle = (i / categories.length) * Math.PI * 2 - Math.PI / 2;
    catPositions[cat.id] = {
      x: cx + Math.cos(angle) * 220,
      y: cy + Math.sin(angle) * 220,
    };
  });

  // Initialize node positions around their category center
  const pos = {};
  nodes.forEach((node, i) => {
    const catPos = catPositions[node.categoryId] || { x: cx, y: cy };
    const siblings = nodes.filter(n => n.categoryId === node.categoryId);
    const idx = siblings.indexOf(node);
    const angle = (idx / Math.max(siblings.length, 1)) * Math.PI * 2;
    const spread = 50 + siblings.length * 8;
    pos[node.id] = {
      x: catPos.x + Math.cos(angle) * spread + (Math.random() - 0.5) * 20,
      y: catPos.y + Math.sin(angle) * spread + (Math.random() - 0.5) * 20,
      vx: 0, vy: 0,
    };
  });

  // Build edge lookup
  const edgeSet = new Set(edges.map(e => `${e.source}-${e.target}`));
  const isConnected = (a, b) => edgeSet.has(`${a}-${b}`) || edgeSet.has(`${b}-${a}`);

  // Force simulation (60 iterations)
  for (let iter = 0; iter < 60; iter++) {
    const alpha = 1 - iter / 60;

    // Repulsion between all nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = pos[nodes[i].id], b = pos[nodes[j].id];
        let dx = b.x - a.x, dy = b.y - a.y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const force = (800 / (dist * dist)) * alpha;
        const fx = (dx / dist) * force, fy = (dy / dist) * force;
        a.vx -= fx; a.vy -= fy;
        b.vx += fx; b.vy += fy;
      }
    }

    // Attraction along edges
    for (const edge of edges) {
      const a = pos[edge.source], b = pos[edge.target];
      if (!a || !b) continue;
      let dx = b.x - a.x, dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const idealDist = 90;
      const force = (dist - idealDist) * 0.02 * alpha;
      const fx = (dx / Math.max(dist, 1)) * force;
      const fy = (dy / Math.max(dist, 1)) * force;
      a.vx += fx; a.vy += fy;
      b.vx -= fx; b.vy -= fy;
    }

    // Category gravity (pull nodes toward their category center)
    for (const node of nodes) {
      const p = pos[node.id];
      const catPos = catPositions[node.categoryId];
      if (!catPos) continue;
      const dx = catPos.x - p.x, dy = catPos.y - p.y;
      p.vx += dx * 0.005 * alpha;
      p.vy += dy * 0.005 * alpha;
    }

    // Center gravity
    for (const node of nodes) {
      const p = pos[node.id];
      p.vx += (cx - p.x) * 0.001 * alpha;
      p.vy += (cy - p.y) * 0.001 * alpha;
    }

    // Apply velocities with damping
    for (const node of nodes) {
      const p = pos[node.id];
      p.vx *= 0.6;
      p.vy *= 0.6;
      p.x += p.vx;
      p.y += p.vy;
      // Boundary
      p.x = Math.max(40, Math.min(W - 40, p.x));
      p.y = Math.max(40, Math.min(H - 40, p.y));
    }
  }

  return { positions: pos, catPositions, width: W, height: H };
}

export default function GraphView({ onSelectArticle, onOpenDetail }) {
  const { linkedRegsByArticle, linkCountByArticle } = useUserDataContext();
  const [selected, setSelected] = useState(null);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: 800, h: 800 });
  const svgRef = useRef(null);
  const dragRef = useRef(null);
  const lastTapRef = useRef(0);

  // Build edges from relatedTo
  const edges = useMemo(() => {
    const result = [];
    const seen = new Set();
    for (const art of allArticles) {
      for (const targetId of (art.relatedTo || [])) {
        const key = [art.id, targetId].sort().join('-');
        if (!seen.has(key)) {
          seen.add(key);
          result.push({ source: art.id, target: targetId, type: 'related' });
        }
      }
    }
    return result;
  }, []);

  // Compute layout (memoized, stable)
  const layout = useMemo(() => {
    return computeLayout(allArticles, edges);
  }, [edges]);

  // Connection counts for node sizing
  const connectionCount = useMemo(() => {
    const counts = {};
    for (const art of allArticles) counts[art.id] = 0;
    for (const e of edges) {
      counts[e.source] = (counts[e.source] || 0) + 1;
      counts[e.target] = (counts[e.target] || 0) + 1;
    }
    return counts;
  }, [edges]);

  // Selected node's connections
  const selectedConnections = useMemo(() => {
    if (!selected) return new Set();
    const connected = new Set();
    for (const e of edges) {
      if (e.source === selected) connected.add(e.target);
      if (e.target === selected) connected.add(e.source);
    }
    return connected;
  }, [selected, edges]);

  const selectedArt = selected ? allArticles.find(a => a.id === selected) : null;
  const selectedRegs = selected ? (linkedRegsByArticle[selected] || []) : [];

  // Touch/mouse handlers for pan
  const handlePointerDown = useCallback((e) => {
    if (e.target.closest('.graph-node')) return;
    const pt = e.touches ? e.touches[0] : e;
    dragRef.current = { startX: pt.clientX, startY: pt.clientY, startVB: { ...viewBox } };
  }, [viewBox]);

  const handlePointerMove = useCallback((e) => {
    if (!dragRef.current) return;
    const pt = e.touches ? e.touches[0] : e;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const scaleX = viewBox.w / rect.width;
    const scaleY = viewBox.h / rect.height;
    const dx = (dragRef.current.startX - pt.clientX) * scaleX;
    const dy = (dragRef.current.startY - pt.clientY) * scaleY;
    setViewBox({
      ...dragRef.current.startVB,
      x: dragRef.current.startVB.x + dx,
      y: dragRef.current.startVB.y + dy,
    });
  }, [viewBox]);

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  // Wheel zoom
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 1.1 : 0.9;
    setViewBox(prev => {
      const newW = Math.max(200, Math.min(1600, prev.w * factor));
      const newH = Math.max(200, Math.min(1600, prev.h * factor));
      return {
        x: prev.x + (prev.w - newW) / 2,
        y: prev.y + (prev.h - newH) / 2,
        w: newW, h: newH,
      };
    });
  }, []);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    svg.addEventListener('wheel', handleWheel, { passive: false });
    return () => svg.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const handleNodeTap = useCallback((artId) => {
    const now = Date.now();
    if (now - lastTapRef.current < 400 && selected === artId) {
      // Double tap -> open detail
      onOpenDetail?.(artId);
      lastTapRef.current = 0;
      return;
    }
    lastTapRef.current = now;
    setSelected(prev => prev === artId ? null : artId);
  }, [selected, onOpenDetail]);

  // Zoom controls
  const zoomIn = () => setViewBox(prev => {
    const f = 0.8;
    const nw = prev.w * f, nh = prev.h * f;
    return { x: prev.x + (prev.w - nw) / 2, y: prev.y + (prev.h - nh) / 2, w: nw, h: nh };
  });
  const zoomOut = () => setViewBox(prev => {
    const f = 1.25;
    const nw = Math.min(1600, prev.w * f), nh = Math.min(1600, prev.h * f);
    return { x: prev.x + (prev.w - nw) / 2, y: prev.y + (prev.h - nh) / 2, w: nw, h: nh };
  });
  const resetView = () => setViewBox({ x: 0, y: 0, w: 800, h: 800 });

  return (
    <div style={{ position: 'relative', width: '100%', height: 'calc(100dvh - 140px)', minHeight: 400 }}>
      {/* SVG Graph */}
      <svg
        ref={svgRef}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
        style={{
          width: '100%', height: '100%',
          touchAction: 'none', cursor: dragRef.current ? 'grabbing' : 'grab',
          background: colors.bg,
        }}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
      >
        {/* Category zone backgrounds */}
        {lawData.categories.map(cat => {
          const cp = layout.catPositions[cat.id];
          if (!cp) return null;
          return (
            <g key={`cat-${cat.id}`}>
              <circle
                cx={cp.x} cy={cp.y} r={100}
                fill={cat.color} opacity={0.03}
              />
              <text
                x={cp.x} y={cp.y - 85}
                textAnchor="middle" fontSize={11} fontWeight={700}
                fill={cat.color} opacity={0.6}
              >{cat.name}</text>
            </g>
          );
        })}

        {/* Edges */}
        {edges.map(edge => {
          const a = layout.positions[edge.source];
          const b = layout.positions[edge.target];
          if (!a || !b) return null;

          const isHighlighted = selected && (edge.source === selected || edge.target === selected);
          const isDimmed = selected && !isHighlighted;

          return (
            <line
              key={`${edge.source}-${edge.target}`}
              x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke={isHighlighted ? '#60a5fa' : 'rgba(255,255,255,0.12)'}
              strokeWidth={isHighlighted ? 2 : 0.8}
              opacity={isDimmed ? 0.04 : isHighlighted ? 0.9 : 0.25}
            />
          );
        })}

        {/* Nodes */}
        {allArticles.map(art => {
          const p = layout.positions[art.id];
          if (!p) return null;

          const conn = connectionCount[art.id] || 0;
          const r = Math.max(10, Math.min(20, 8 + conn * 2));
          const isSelected = selected === art.id;
          const isConnected = selectedConnections.has(art.id);
          const isDimmed = selected && !isSelected && !isConnected;
          const hasLinks = (linkCountByArticle[art.id] || 0) > 0;

          return (
            <g
              key={art.id}
              className="graph-node"
              onClick={() => handleNodeTap(art.id)}
              style={{ cursor: 'pointer' }}
              opacity={isDimmed ? 0.2 : 1}
            >
              {/* Glow for selected */}
              {isSelected && (
                <circle cx={p.x} cy={p.y} r={r + 6}
                  fill="none" stroke={art.categoryColor} strokeWidth={2} opacity={0.5}
                />
              )}
              {/* User link indicator ring */}
              {hasLinks && !isSelected && (
                <circle cx={p.x} cy={p.y} r={r + 3}
                  fill="none" stroke="#06b6d4" strokeWidth={1.5} opacity={0.4}
                  strokeDasharray="3,2"
                />
              )}
              {/* Main circle */}
              <circle
                cx={p.x} cy={p.y} r={r}
                fill={art.categoryColor}
                opacity={isSelected ? 1 : isConnected ? 0.85 : 0.6}
                stroke={isSelected ? '#fff' : 'none'}
                strokeWidth={isSelected ? 1.5 : 0}
              />
              {/* Label */}
              <text
                x={p.x} y={p.y + r + 11}
                textAnchor="middle" fontSize={7} fontWeight={600}
                fill={isDimmed ? colors.textDim : colors.textSub}
              >
                {art.article}
              </text>
              {/* Title on hover / selected */}
              {(isSelected || isConnected) && (
                <text
                  x={p.x} y={p.y - r - 5}
                  textAnchor="middle" fontSize={6} fontWeight={500}
                  fill={colors.textMuted}
                >
                  {art.title.length > 10 ? art.title.slice(0, 10) + '…' : art.title}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Zoom controls */}
      <div style={{
        position: 'absolute', top: 8, right: 8,
        display: 'flex', flexDirection: 'column', gap: 4,
      }}>
        {[{ label: '+', fn: zoomIn }, { label: '−', fn: zoomOut }, { label: '⟳', fn: resetView }].map(b => (
          <button key={b.label} onClick={b.fn} style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'rgba(15,20,35,0.85)', border: `1px solid ${colors.borderLight}`,
            color: colors.textSub, fontSize: 16, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'inherit', backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}>{b.label}</button>
        ))}
      </div>

      {/* Legend */}
      <div style={{
        position: 'absolute', bottom: selected ? 100 : 8, left: 8,
        display: 'flex', flexWrap: 'wrap', gap: 6,
        background: 'rgba(15,20,35,0.85)', borderRadius: 8,
        padding: '6px 10px', backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: `1px solid ${colors.border}`,
        transition: 'bottom 0.2s',
      }}>
        {lawData.categories.map(cat => (
          <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%', background: cat.color, flexShrink: 0,
            }} />
            <span style={{ fontSize: 9, color: colors.textMuted }}>{cat.name}</span>
          </div>
        ))}
      </div>

      {/* Selected node info panel */}
      {selectedArt && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'rgba(15,20,35,0.95)',
          borderTop: `1px solid ${colors.borderLight}`,
          padding: '10px 14px',
          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: selectedArt.categoryColor, flexShrink: 0,
            }} />
            <span style={{ fontSize: 13, fontWeight: 800, color: selectedArt.categoryColor }}>
              {selectedArt.article}
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: colors.white }}>
              {selectedArt.title}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 12, fontSize: 11, color: colors.textSub }}>
            <span>接続: {connectionCount[selected] || 0}件</span>
            {selectedRegs.length > 0 && (
              <span style={{ color: '#06b6d4' }}>
                紐付: {selectedRegs.map(r => r.category + ' ' + r.referenceNumber).join(', ')}
              </span>
            )}
          </div>

          <button
            onClick={() => onOpenDetail?.(selected)}
            style={{
              marginTop: 6, padding: '6px 14px', borderRadius: 6,
              background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.3)',
              color: colors.accent, fontSize: 11, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >詳細を開く →</button>
        </div>
      )}
    </div>
  );
}
