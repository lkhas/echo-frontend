import { useEffect, useRef, useState, useCallback } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface VimRow {
  id: string | number;
  influence_factor: string;
  influence_affect?: string;
  sdg?: string;
  target?: string;
  indicator?: string;
  polarity?: string;
  directness?: string;
  domain?: string;
}

interface DiagramNode {
  id: string;
  label: string;
  sublabel?: string;
  type: "factor" | "sdg" | "target" | "indicator";
  x: number;
  y: number;
}

interface DiagramEdge {
  from: string;
  to: string;
  polarity: string;
  directness: string;
  row: VimRow;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const POS_COLOR = "#22c55e";
const NEG_COLOR = "#ef4444";
const W = 680;

function getColor(polarity: string) {
  return polarity === "Positive" ? POS_COLOR : NEG_COLOR;
}

function getStrokeDash(directness: string) {
  return directness === "Direct" ? "none" : "6 4";
}

function getStrokeWidth(directness: string) {
  return directness === "Direct" ? 1.8 : 1.3;
}

function nodeRadius(type: DiagramNode["type"]) {
  if (type === "factor") return 28;
  if (type === "sdg") return 20;
  if (type === "target") return 14;
  return 12;
}

function wrapText(text: string, maxChars = 13): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  words.forEach((w) => {
    if ((current + " " + w).trim().length > maxChars) {
      lines.push(current.trim());
      current = w;
    } else {
      current = (current + " " + w).trim();
    }
  });
  if (current) lines.push(current);
  return lines;
}

function edgePath(fn: DiagramNode, tn: DiagramNode): string {
  const fr = nodeRadius(fn.type);
  const tr = nodeRadius(tn.type);
  const dx = tn.x - fn.x;
  const cx1 = fn.x + dx * 0.45;
  const cx2 = tn.x - dx * 0.45;
  return `M${fn.x + fr} ${fn.y} C${cx1} ${fn.y} ${cx2} ${tn.y} ${tn.x - tr} ${tn.y}`;
}

// ─── Main Component ──────────────────────────────────────────────────────────
export const VimNetworkDiagram = ({ data }: { data: VimRow[] }) => {
  const [activeFilter, setActiveFilter] = useState<"all" | "positive" | "negative" | "direct">("all");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; html: string } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  if (!data || data.length === 0) return null;

  // ── Build node maps ──────────────────────────────────────────────────────
  const sdgMap: Record<string, DiagramNode> = {};
  const targetMap: Record<string, DiagramNode> = {};
  const indicatorMap: Record<string, DiagramNode> = {};

  data.forEach((r) => {
    if (r.sdg && !sdgMap[r.sdg]) {
      const parts = r.sdg.split(" - ");
      sdgMap[r.sdg] = {
        id: "sdg_" + Object.keys(sdgMap).length,
        label: parts[0] || r.sdg,
        sublabel: parts[1],
        type: "sdg",
        x: 0,
        y: 0,
      };
    }
    const tKey = r.sdg + "_" + r.target;
    if (r.target && r.sdg && !targetMap[tKey]) {
      targetMap[tKey] = {
        id: "tgt_" + Object.keys(targetMap).length,
        label: r.target,
        type: "target",
        x: 0,
        y: 0,
      };
    }
    const iKey = r.sdg + "_" + r.indicator;
    if (r.indicator && r.sdg && !indicatorMap[iKey]) {
      indicatorMap[iKey] = {
        id: "ind_" + Object.keys(indicatorMap).length,
        label: r.indicator,
        type: "indicator",
        x: 0,
        y: 0,
      };
    }
  });

  // ── Assign positions ──────────────────────────────────────────────────────
  const PAD_TOP = 50;
  const H_USABLE = Math.max(data.length * 58, 400);
  const SVG_H = H_USABLE + PAD_TOP + 40;

  const factorNodes: DiagramNode[] = data.map((r, i) => ({
    id: "fac_" + r.id,
    label: r.influence_factor,
    type: "factor",
    x: 90,
    y: PAD_TOP + i * (H_USABLE / Math.max(data.length - 1, 1)),
  }));

  const sdgList = Object.values(sdgMap);
  sdgList.forEach((n, i) => {
    n.x = 255;
    n.y = PAD_TOP + i * (H_USABLE / Math.max(sdgList.length - 1, 1));
  });

  const tgtList = Object.values(targetMap);
  tgtList.forEach((n, i) => {
    n.x = 420;
    n.y = PAD_TOP + i * (H_USABLE / Math.max(tgtList.length - 1, 1));
  });

  const indList = Object.values(indicatorMap);
  indList.forEach((n, i) => {
    n.x = 580;
    n.y = PAD_TOP + i * (H_USABLE / Math.max(indList.length - 1, 1));
  });

  const allNodes = [...factorNodes, ...sdgList, ...tgtList, ...indList];
  const nodeById: Record<string, DiagramNode> = {};
  allNodes.forEach((n) => (nodeById[n.id] = n));

  // ── Build edges ───────────────────────────────────────────────────────────
  const edgeSet = new Set<string>();
  const edges: DiagramEdge[] = [];

  data.forEach((r) => {
    const fac = factorNodes.find((n) => n.id === "fac_" + r.id);
    const sdg = r.sdg ? sdgMap[r.sdg] : null;
    const tgt = r.sdg && r.target ? targetMap[r.sdg + "_" + r.target] : null;
    const ind = r.sdg && r.indicator ? indicatorMap[r.sdg + "_" + r.indicator] : null;

    const addEdge = (from: DiagramNode, to: DiagramNode) => {
      const key = from.id + "→" + to.id + r.polarity + r.directness;
      if (!edgeSet.has(key)) {
        edgeSet.add(key);
        edges.push({ from: from.id, to: to.id, polarity: r.polarity || "", directness: r.directness || "", row: r });
      }
    };

    if (fac && sdg) addEdge(fac, sdg);
    if (sdg && tgt) addEdge(sdg, tgt);
    if (tgt && ind) addEdge(tgt, ind);
  });

  // ── Compute hovered related IDs ───────────────────────────────────────────
  const relatedIds = new Set<string>();
  if (hoveredId) {
    relatedIds.add(hoveredId);
    edges.forEach((e) => {
      if (e.from === hoveredId || e.to === hoveredId) {
        relatedIds.add(e.from);
        relatedIds.add(e.to);
      }
    });
  }

  const isEdgeVisible = (e: DiagramEdge) => {
    if (activeFilter === "positive") return e.polarity === "Positive";
    if (activeFilter === "negative") return e.polarity === "Negative";
    if (activeFilter === "direct") return e.directness === "Direct";
    return true;
  };

  const isNodeFaded = (id: string) => hoveredId !== null && !relatedIds.has(id);
  const isEdgeFaded = (e: DiagramEdge) =>
    hoveredId !== null && !relatedIds.has(e.from) && !relatedIds.has(e.to);

  // ── Tooltip helpers ───────────────────────────────────────────────────────
  const showTooltip = useCallback(
    (nodeId: string, clientX: number, clientY: number) => {
      setHoveredId(nodeId);
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const x = clientX - rect.left + 12;
      const y = clientY - rect.top - 10;
      const n = nodeById[nodeId];
      if (!n) return;

      const related = data.filter((r) => {
        const fId = "fac_" + r.id;
        const sId = r.sdg ? sdgMap[r.sdg]?.id : null;
        const tId = r.sdg && r.target ? targetMap[r.sdg + "_" + r.target]?.id : null;
        const iId = r.sdg && r.indicator ? indicatorMap[r.sdg + "_" + r.indicator]?.id : null;
        return [fId, sId, tId, iId].includes(nodeId);
      });

      let html = "";
      if (n.type === "factor" && related[0]) {
        const r = related[0];
        const col = getColor(r.polarity || "");
        html = `<strong>${n.label}</strong><br/><span style="color:var(--color-text-secondary);font-size:11px">${r.influence_affect || ""}</span><br/><span style="color:${col};font-size:11px">${r.polarity} · ${r.directness}</span>`;
      } else if (n.type === "sdg") {
        html = `<strong>${n.label}${n.sublabel ? " – " + n.sublabel : ""}</strong><br/><span style="color:var(--color-text-secondary);font-size:11px">${related.length} factor(s) mapped</span>`;
      } else if (n.type === "target") {
        html = `<strong>Target ${n.label}</strong><br/><span style="color:var(--color-text-secondary);font-size:11px">${related.map((r) => r.influence_factor).join(", ")}</span>`;
      } else {
        html = `<strong>Indicator ${n.label}</strong>`;
      }
      setTooltip({ x, y, html });
    },
    [data, nodeById, sdgMap, targetMap, indicatorMap]
  );

  const hideTooltip = useCallback(() => {
    setHoveredId(null);
    setTooltip(null);
  }, []);

  // ─── Column header labels ─────────────────────────────────────────────────
  const colLabels = [
    { x: 90, label: "Factors" },
    { x: 255, label: "SDGs" },
    { x: 420, label: "Targets" },
    { x: 580, label: "Indicators" },
  ];

  return (
    <div className="rounded-2xl border border-violet-500/15 bg-card/50 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-border/40 bg-gradient-to-r from-violet-500/8 to-transparent flex items-center gap-2.5 flex-wrap">
        <div className="p-1.5 rounded-lg bg-violet-500/12 border border-violet-500/20">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-violet-500">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
        </div>
        <h2 className="text-sm font-semibold text-foreground">VIM Causal Network</h2>
        <span className="text-xs text-muted-foreground ml-1">Hover any node to trace connections</span>

        {/* Filter pills */}
        <div className="flex gap-1.5 ml-auto flex-wrap">
          {(["all", "positive", "negative", "direct"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`text-[11px] px-3 py-1 rounded-full border transition-all capitalize ${
                activeFilter === f
                  ? "bg-violet-500/10 border-violet-500/30 text-violet-600"
                  : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-1.5 px-5 py-2.5 border-b border-border/30 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="inline-block w-6 h-px bg-[#22c55e]" />Positive</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-6 h-px bg-[#ef4444]" />Negative</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-6 border-t border-[#22c55e]" />Direct</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-6 border-t border-dashed border-[#ef4444]" />Indirect</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-full bg-violet-500" />Factor</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-full bg-sky-500" />SDG</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 ring-1 ring-amber-600" />Target</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" />Indicator</span>
      </div>

      {/* SVG canvas */}
      <div className="relative overflow-x-auto p-4">
        {tooltip && (
          <div
            className="absolute z-10 pointer-events-none rounded-xl border border-border/60 bg-card px-3 py-2 text-xs shadow-lg max-w-[220px]"
            style={{ left: tooltip.x, top: tooltip.y }}
            dangerouslySetInnerHTML={{ __html: tooltip.html }}
          />
        )}

        <svg
          ref={svgRef}
          width="100%"
          viewBox={`0 0 ${W} ${SVG_H}`}
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="VIM causal network diagram"
        >
          <defs>
            <marker id="arr-pos-net" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M2 1L8 5L2 9" fill="none" stroke={POS_COLOR} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </marker>
            <marker id="arr-neg-net" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M2 1L8 5L2 9" fill="none" stroke={NEG_COLOR} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </marker>
          </defs>

          {/* Column labels */}
          {colLabels.map((col) => (
            <text
              key={col.x}
              x={col.x}
              y={20}
              textAnchor="middle"
              fontSize={10}
              fontWeight={500}
              fill="var(--muted-foreground, #888)"
              style={{ textTransform: "uppercase", letterSpacing: "0.08em" }}
            >
              {col.label}
            </text>
          ))}

          {/* Edges */}
          <g>
            {edges.map((e, i) => {
              const fn = nodeById[e.from];
              const tn = nodeById[e.to];
              if (!fn || !tn) return null;
              if (!isEdgeVisible(e)) return null;
              const faded = isEdgeFaded(e);
              return (
                <path
                  key={i}
                  d={edgePath(fn, tn)}
                  fill="none"
                  stroke={getColor(e.polarity)}
                  strokeWidth={getStrokeWidth(e.directness)}
                  strokeDasharray={getStrokeDash(e.directness)}
                  markerEnd={
                    e.polarity === "Positive"
                      ? "url(#arr-pos-net)"
                      : "url(#arr-neg-net)"
                  }
                  opacity={faded ? 0.05 : 0.55}
                  style={{ transition: "opacity 0.2s" }}
                />
              );
            })}
          </g>

          {/* Nodes */}
          <g>
            {allNodes.map((n) => {
              const faded = isNodeFaded(n.id);
              const r = nodeRadius(n.type);

              return (
                <g
                  key={n.id}
                  style={{ cursor: "pointer", opacity: faded ? 0.12 : 1, transition: "opacity 0.2s" }}
                  onMouseEnter={(e) => showTooltip(n.id, e.clientX, e.clientY)}
                  onMouseMove={(e) => showTooltip(n.id, e.clientX, e.clientY)}
                  onMouseLeave={hideTooltip}
                >
                  {n.type === "factor" && (
                    <>
                      <circle cx={n.x} cy={n.y} r={r} fill="#8b5cf6" stroke="#7c3aed" strokeWidth={1} />
                      {wrapText(n.label, 13).map((line, li, arr) => (
                        <text
                          key={li}
                          x={n.x}
                          textAnchor="middle"
                          y={n.y - (arr.length - 1) * 7 + li * 14}
                          dominantBaseline="central"
                          fontSize={9}
                          fill="white"
                          fontWeight={500}
                        >
                          {line}
                        </text>
                      ))}
                    </>
                  )}

                  {n.type === "sdg" && (
                    <>
                      <circle cx={n.x} cy={n.y} r={r} fill="#0ea5e9" stroke="#0284c7" strokeWidth={1} />
                      <text x={n.x} y={n.y} textAnchor="middle" dominantBaseline="central" fontSize={9} fill="white" fontWeight={500}>
                        {n.label}
                      </text>
                      {n.sublabel && (
                        <text x={n.x + r + 4} y={n.y} textAnchor="start" dominantBaseline="central" fontSize={9} fill="var(--color-text-secondary, #888)" style={{ maxWidth: "80px" }}>
                          {n.sublabel.length > 12 ? n.sublabel.slice(0, 12) + "…" : n.sublabel}
                        </text>
                      )}
                    </>
                  )}

                  {n.type === "target" && (
                    <>
                      <circle cx={n.x} cy={n.y} r={r} fill="#f59e0b" stroke="#d97706" strokeWidth={1.5} />
                      <text x={n.x} y={n.y} textAnchor="middle" dominantBaseline="central" fontSize={9} fill="#1a1a1a" fontWeight={500}>
                        {n.label}
                      </text>
                    </>
                  )}

                  {n.type === "indicator" && (
                    <>
                      <circle cx={n.x} cy={n.y} r={r} fill="#10b981" stroke="#059669" strokeWidth={1} />
                      <text x={n.x} y={n.y} textAnchor="middle" dominantBaseline="central" fontSize={8} fill="white" fontWeight={500}>
                        {n.label}
                      </text>
                    </>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
};