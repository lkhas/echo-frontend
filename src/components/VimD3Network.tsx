import { useEffect, useRef, useState } from "react";

// ─── prop types ───────────────────────────────────────────────────────────────
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
  dimension?: string;
}

// ─── visual constants ─────────────────────────────────────────────────────────
const NODE_COLOR: Record<string, string> = {
  factor:    "#8b5cf6",
  domain:    "#6366f1",
  dimension: "#ec4899",
  sdg:       "#0ea5e9",
  target:    "#f59e0b",
  indicator: "#10b981",
};
const NODE_STROKE: Record<string, string> = {
  factor:    "#7c3aed",
  domain:    "#4f46e5",
  dimension: "#db2777",
  sdg:       "#0284c7",
  target:    "#d97706",
  indicator: "#059669",
};
const NODE_R: Record<string, number> = {
  factor: 22, domain: 26, dimension: 20, sdg: 18, target: 13, indicator: 11,
};

const edgeColor = (p: string) => (p === "Positive" ? "#22c55e" : "#ef4444");
const edgeDash  = (d: string) => (d === "Direct"   ? "none"    : "6 3");

// ─── node/link data shapes (build-time only) ──────────────────────────────────
type GNode = {
  id: string; label: string; fullLabel?: string; type: string;
  affect?: string; polarity?: string; directness?: string;
  domain?: string; dimension?: string;
  x?: number; y?: number; fx?: number | null; fy?: number | null;
};
type GLink = {
  source: string; target: string;
  polarity: string; directness: string;
  linkType: "factor-domain" | "factor-dimension" | "domain-dimension" |
            "dimension-sdg" | "factor-sdg" | "sdg-target" | "target-indicator";
};

// ─── helpers ──────────────────────────────────────────────────────────────────
function wrapLabel(text: string, maxCh = 11): string[] {
  const words = text.split(" ");
  const lines: string[] = []; let cur = "";
  words.forEach((w) => {
    if ((cur + " " + w).trim().length > maxCh) { lines.push(cur.trim()); cur = w; }
    else cur = (cur + " " + w).trim();
  });
  if (cur) lines.push(cur);
  return lines;
}

// ─── main component ───────────────────────────────────────────────────────────
export const VimD3Network = ({ data }: { data: VimRow[] }) => {
  const svgRef   = useRef<SVGSVGElement>(null);
  const wrapRef  = useRef<HTMLDivElement>(null);
  const simRef   = useRef<any>(null);
  const linksRef = useRef<GLink[]>([]);

  const [filter,   setFilter]   = useState("all");
  const [strength, setStrength] = useState(100);
  const [tip,      setTip]      = useState<{ x: number; y: number; html: string } | null>(null);
  const [ready,    setReady]    = useState(false);

  // ── load D3 from CDN once ────────────────────────────────────────────────
  useEffect(() => {
    if ((window as any).d3) { setReady(true); return; }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js";
    s.onload = () => setReady(true);
    document.head.appendChild(s);
  }, []);

  // ── build + render graph ─────────────────────────────────────────────────
  useEffect(() => {
    if (!ready || !data.length) return;
    const d3: any = (window as any).d3;
    const svgEl = svgRef.current!;
    const W = 800, H = 580;
    d3.select(svgEl).selectAll("*").remove();

    // ── collect unique domain / dimension / sdg / target / indicator ────────
    const domainMap:    Record<string, GNode> = {};
    const dimMap:       Record<string, GNode> = {};
    const sdgMap:       Record<string, GNode> = {};
    const targetMap:    Record<string, GNode> = {};
    const indicatorMap: Record<string, GNode> = {};

    data.forEach((r) => {
      if (r.domain && !domainMap[r.domain])
        domainMap[r.domain] = { id: "dom_" + r.domain, label: r.domain, type: "domain" };
      if (r.dimension && !dimMap[r.dimension])
        dimMap[r.dimension] = { id: "dim_" + r.dimension, label: r.dimension, type: "dimension" };
      if (r.sdg && !sdgMap[r.sdg]) {
        const parts = r.sdg.split(" - ");
        sdgMap[r.sdg] = { id: "sdg_" + r.sdg, label: parts[0] || r.sdg, fullLabel: r.sdg, type: "sdg" };
      }
      const tk = (r.sdg || "") + "_" + r.target;
      if (r.target && r.sdg && !targetMap[tk])
        targetMap[tk] = { id: "tgt_" + tk, label: r.target, type: "target" };
      const ik = (r.sdg || "") + "_" + r.indicator;
      if (r.indicator && r.sdg && !indicatorMap[ik])
        indicatorMap[ik] = { id: "ind_" + ik, label: r.indicator, type: "indicator" };
    });

    const nodes: GNode[] = [
      ...data.map((r) => ({
        id: "fac_" + r.id, label: r.influence_factor, type: "factor",
        affect: r.influence_affect, polarity: r.polarity, directness: r.directness,
        domain: r.domain, dimension: r.dimension,
      })),
      ...Object.values(domainMap),
      ...Object.values(dimMap),
      ...Object.values(sdgMap),
      ...Object.values(targetMap),
      ...Object.values(indicatorMap),
    ];

    // ── build edges ──────────────────────────────────────────────────────────
    const edgeSet = new Set<string>();
    const links: GLink[] = [];

    const addEdge = (
      s: string, t: string,
      polarity: string, directness: string,
      linkType: GLink["linkType"]
    ) => {
      const k = s + "→" + t + linkType;
      const hasS = nodes.some((n) => n.id === s);
      const hasT = nodes.some((n) => n.id === t);
      if (!edgeSet.has(k) && hasS && hasT) {
        edgeSet.add(k);
        links.push({ source: s, target: t, polarity, directness, linkType });
      }
    };

    data.forEach((r) => {
      const fId = "fac_" + r.id;
      const pol  = r.polarity   || "Positive";
      const dir  = r.directness || "Direct";

      // factor → domain
      if (r.domain)     addEdge(fId, "dom_" + r.domain, pol, dir, "factor-domain");
      // domain → dimension
      if (r.domain && r.dimension)
        addEdge("dom_" + r.domain, "dim_" + r.dimension, pol, dir, "domain-dimension");
      // factor → dimension (also direct link)
      if (r.dimension)  addEdge(fId, "dim_" + r.dimension, pol, dir, "factor-dimension");
      // dimension → sdg  (or factor → sdg if no dimension)
      if (r.sdg) {
        const sId = "sdg_" + r.sdg;
        if (r.dimension) addEdge("dim_" + r.dimension, sId, pol, dir, "dimension-sdg");
        else             addEdge(fId, sId, pol, dir, "factor-sdg");
      }
      // sdg → target → indicator
      if (r.sdg && r.target) {
        const sId = "sdg_" + r.sdg;
        const tId = "tgt_" + r.sdg + "_" + r.target;
        addEdge(sId, tId, pol, dir, "sdg-target");
        if (r.indicator) {
          const iId = "ind_" + r.sdg + "_" + r.indicator;
          addEdge(tId, iId, pol, dir, "target-indicator");
        }
      }
    });

    linksRef.current = links;

    // ── SVG shell ────────────────────────────────────────────────────────────
    const root = d3.select(svgEl).attr("viewBox", `0 0 ${W} ${H}`);

    // arrowhead markers
    const defs = root.append("defs");
    ["pos", "neg"].forEach((k) => {
      const col = k === "pos" ? "#22c55e" : "#ef4444";
      defs.append("marker")
        .attr("id", `vim-arr-${k}`)
        .attr("viewBox", "0 0 10 10").attr("refX", 9).attr("refY", 5)
        .attr("markerWidth", 5).attr("markerHeight", 5).attr("orient", "auto-start-reverse")
        .append("path").attr("d", "M1 1L9 5L1 9")
        .attr("fill", "none").attr("stroke", col)
        .attr("stroke-width", 1.5).attr("stroke-linecap", "round").attr("stroke-linejoin", "round");
    });

    // glow filter for hovered nodes
    const filt = defs.append("filter").attr("id", "vim-glow").attr("x", "-50%").attr("y", "-50%").attr("width", "200%").attr("height", "200%");
    filt.append("feGaussianBlur").attr("stdDeviation", 4).attr("result", "blur");
    const merge = filt.append("feMerge");
    merge.append("feMergeNode").attr("in", "blur");
    merge.append("feMergeNode").attr("in", "SourceGraphic");

    // zoom/pan
    const zoomG = root.append("g");
    root.call(d3.zoom().scaleExtent([0.2, 4]).on("zoom", (ev: any) => zoomG.attr("transform", ev.transform)));

    const linkG = zoomG.append("g").attr("fill", "none");
    const nodeG = zoomG.append("g");

    // ── render links ─────────────────────────────────────────────────────────
    const linkSel = linkG.selectAll("line")
      .data(links).join("line")
      .attr("stroke", (d: any) => edgeColor(d.polarity))
      .attr("stroke-width", (d: any) => {
        if (d.linkType === "factor-domain" || d.linkType === "domain-dimension") return 2;
        if (d.linkType === "factor-dimension") return 1.6;
        return d.directness === "Direct" ? 1.5 : 1.1;
      })
      .attr("stroke-dasharray", (d: any) => edgeDash(d.directness))
      .attr("marker-end", (d: any) => d.polarity === "Positive" ? "url(#vim-arr-pos)" : "url(#vim-arr-neg)")
      .attr("opacity", (d: any) => d.linkType === "factor-dimension" ? 0.25 : 0.5);

    // ── render node groups ───────────────────────────────────────────────────
    const nodeGrp = nodeG.selectAll("g")
      .data(nodes).join("g")
      .attr("cursor", "grab")
      .call(
        d3.drag()
          .on("start", (ev: any, d: any) => { if (!ev.active) simRef.current.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
          .on("drag",  (ev: any, d: any) => { d.fx = ev.x; d.fy = ev.y; })
          .on("end",   (ev: any, d: any) => { if (!ev.active) simRef.current.alphaTarget(0); d.fx = null; d.fy = null; })
      )
      .on("mouseenter", function (ev: MouseEvent, d: any) {
        const wRect = wrapRef.current!.getBoundingClientRect();
        let tx = ev.clientX - wRect.left + 16;
        let ty = ev.clientY - wRect.top  - 10;
        if (tx + 230 > wRect.width) tx = ev.clientX - wRect.left - 238;

        // fade unrelated
        const relIds = new Set<string>([d.id]);
        links.forEach((l: any) => {
          const s = l.source.id ?? l.source;
          const t = l.target.id ?? l.target;
          if (s === d.id || t === d.id) { relIds.add(s); relIds.add(t); }
        });
        nodeGrp.attr("opacity", (n: any) => relIds.has(n.id) ? 1 : 0.07);
        linkSel.attr("opacity", (l: any) => {
          const s = l.source.id ?? l.source;
          const t = l.target.id ?? l.target;
          return (s === d.id || t === d.id) ? 0.9 : 0.03;
        });

        // tooltip content
        const connCount = links.filter((l: any) => {
          const s = l.source.id ?? l.source;
          const t = l.target.id ?? l.target;
          return s === d.id || t === d.id;
        }).length;

        const col = edgeColor(d.polarity || "Positive");
        let html = "";
        if (d.type === "factor") {
          html = `
            <strong style="font-size:12px;display:block;margin-bottom:4px">${d.label}</strong>
            ${d.affect  ? `<span style="color:var(--color-text-secondary);font-size:11px;display:block;margin-bottom:3px">${d.affect}</span>` : ""}
            ${d.domain  ? `<span style="font-size:11px;display:block;opacity:.7">📂 ${d.domain}</span>` : ""}
            ${d.dimension ? `<span style="font-size:11px;display:block;opacity:.7">🔷 ${d.dimension}</span>` : ""}
            <span style="color:${col};font-size:11px;margin-top:3px;display:block">${d.polarity || ""} · ${d.directness || ""}</span>`;
        } else if (d.type === "domain") {
          html = `<strong style="font-size:12px;display:block;margin-bottom:3px">📂 ${d.label}</strong>
            <span style="color:var(--color-text-secondary);font-size:11px">${connCount} connection(s)</span>`;
        } else if (d.type === "dimension") {
          html = `<strong style="font-size:12px;display:block;margin-bottom:3px">🔷 ${d.label}</strong>
            <span style="color:var(--color-text-secondary);font-size:11px">${connCount} connection(s)</span>`;
        } else if (d.type === "sdg") {
          html = `<strong style="font-size:12px;display:block;margin-bottom:3px">${d.fullLabel || d.label}</strong>
            <span style="color:var(--color-text-secondary);font-size:11px">${connCount} connection(s)</span>`;
        } else {
          html = `<strong style="font-size:12px;display:block;margin-bottom:3px">${d.type === "target" ? "Target" : "Indicator"} ${d.label}</strong>
            <span style="color:var(--color-text-secondary);font-size:11px">${connCount} link(s)</span>`;
        }
        setTip({ x: tx, y: ty, html });
      })
      .on("mousemove", function (ev: MouseEvent) {
        const r = wrapRef.current!.getBoundingClientRect();
        let tx = ev.clientX - r.left + 16;
        let ty = ev.clientY - r.top  - 10;
        if (tx + 230 > r.width) tx = ev.clientX - r.left - 238;
        setTip((p) => p ? { ...p, x: tx, y: ty } : null);
      })
      .on("mouseleave", function () {
        nodeGrp.attr("opacity", 1);
        linkSel.attr("opacity", (d: any) => d.linkType === "factor-dimension" ? 0.25 : 0.5);
        setTip(null);
      });

    // ── draw node shapes ─────────────────────────────────────────────────────
    // domain: rounded square
    nodeGrp.filter((d: any) => d.type === "domain")
      .append("rect")
      .attr("x", (d: any) => -(NODE_R.domain + 4))
      .attr("y", (d: any) => -(NODE_R.domain + 4))
      .attr("width",  NODE_R.domain * 2 + 8)
      .attr("height", NODE_R.domain * 2 + 8)
      .attr("rx", 8).attr("ry", 8)
      .attr("fill", NODE_COLOR.domain)
      .attr("stroke", NODE_STROKE.domain)
      .attr("stroke-width", 1.5);

    // dimension: hexagon (via path)
    nodeGrp.filter((d: any) => d.type === "dimension").each(function () {
      const r = NODE_R.dimension;
      const pts = Array.from({ length: 6 }, (_, i) => {
        const a = (Math.PI / 3) * i - Math.PI / 6;
        return `${r * Math.cos(a)},${r * Math.sin(a)}`;
      }).join(" ");
      d3.select(this).append("polygon")
        .attr("points", pts)
        .attr("fill",   NODE_COLOR.dimension)
        .attr("stroke", NODE_STROKE.dimension)
        .attr("stroke-width", 1.5);
    });

    // all others: circle
    nodeGrp.filter((d: any) => d.type !== "domain" && d.type !== "dimension")
      .append("circle")
      .attr("r",      (d: any) => NODE_R[d.type] || 12)
      .attr("fill",   (d: any) => NODE_COLOR[d.type] || "#888")
      .attr("stroke", (d: any) => NODE_STROKE[d.type] || "#555")
      .attr("stroke-width", (d: any) => d.type === "target" ? 1.5 : 1);

    // ── labels ───────────────────────────────────────────────────────────────
    nodeGrp.each(function (d: any) {
      const g = d3.select(this);
      const isLight = d.type === "target";
      const fill = isLight ? "#1a1a1a" : "white";
      const maxCh = d.type === "factor" || d.type === "domain" || d.type === "dimension" ? 10 : 8;
      const lines = wrapLabel(d.label, maxCh);
      const lineH = 11;
      lines.forEach((line, li) => {
        g.append("text")
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "central")
          .attr("y", -(lines.length - 1) * (lineH / 2) + li * lineH)
          .attr("font-size", d.type === "factor" || d.type === "domain" ? 8.5 : 8)
          .attr("font-weight", 500)
          .attr("fill", fill)
          .attr("pointer-events", "none")
          .text(line);
      });
    });

    // ── simulation ───────────────────────────────────────────────────────────
    const sim = d3.forceSimulation(nodes)
      .force("link",    d3.forceLink(links).id((d: any) => d.id).distance(strength).strength(0.6))
      .force("charge",  d3.forceManyBody().strength(-380))
      .force("center",  d3.forceCenter(W / 2, H / 2))
      .force("collide", d3.forceCollide().radius((d: any) => (NODE_R[d.type] || 12) + 12))
      .alphaDecay(0.022);

    simRef.current = sim;

    sim.on("tick", () => {
      linkSel
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => {
          const dx = d.target.x - d.source.x, dy = d.target.y - d.source.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const r = (NODE_R[d.target.type] || 12) + 3;
          return d.target.x - (dx / dist) * r;
        })
        .attr("y2", (d: any) => {
          const dx = d.target.x - d.source.x, dy = d.target.y - d.source.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const r = (NODE_R[d.target.type] || 12) + 3;
          return d.target.y - (dy / dist) * r;
        });
      nodeGrp.attr("transform", (d: any) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    return () => { sim.stop(); };
  }, [ready, data]);

  // ── filter ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!ready || !svgRef.current) return;
    const d3: any = (window as any).d3;
    const svg   = d3.select(svgRef.current);
    const links = linksRef.current;

    svg.selectAll("line").attr("display", (d: any) => {
      if (filter === "all")       return null;
      if (filter === "positive")  return d.polarity   === "Positive"  ? null : "none";
      if (filter === "negative")  return d.polarity   === "Negative"  ? null : "none";
      if (filter === "direct")    return d.directness === "Direct"    ? null : "none";
      if (filter === "indirect")  return d.directness === "Indirect"  ? null : "none";
      if (filter === "domain")    return d.linkType === "factor-domain" || d.linkType === "domain-dimension" ? null : "none";
      if (filter === "dimension") return d.linkType.includes("dimension") ? null : "none";
      return null;
    });

    svg.selectAll("g[cursor='grab']").attr("display", (d: any) => {
      if (filter === "all") return null;
      const connected = links.some((l: any) => {
        const s = (l.source as any).id ?? l.source;
        const t = (l.target as any).id ?? l.target;
        if (s !== d.id && t !== d.id) return false;
        if (filter === "positive")  return l.polarity   === "Positive";
        if (filter === "negative")  return l.polarity   === "Negative";
        if (filter === "direct")    return l.directness === "Direct";
        if (filter === "indirect")  return l.directness === "Indirect";
        if (filter === "domain")    return l.linkType === "factor-domain" || l.linkType === "domain-dimension";
        if (filter === "dimension") return (l.linkType as string).includes("dimension");
        return true;
      });
      return connected || d.type === filter ? null : "none";
    });
  }, [filter, ready]);

  // ── link distance slider ──────────────────────────────────────────────────
  useEffect(() => {
    if (!simRef.current) return;
    simRef.current.force("link").distance(strength);
    simRef.current.alpha(0.4).restart();
  }, [strength]);

  const resetLayout = () => {
    if (!simRef.current) return;
    simRef.current.nodes().forEach((n: any) => { n.fx = null; n.fy = null; });
    simRef.current.alpha(0.9).restart();
    const d3: any = (window as any).d3;
    d3.select(svgRef.current).transition().duration(400).call(d3.zoom().transform, d3.zoomIdentity);
  };

  const filters = [
    { key: "all",       label: "All" },
    { key: "positive",  label: "Positive" },
    { key: "negative",  label: "Negative" },
    { key: "direct",    label: "Direct" },
    { key: "indirect",  label: "Indirect" },
    { key: "domain",    label: "Domain links" },
    { key: "dimension", label: "Dimension links" },
  ];

  return (
    <div className="rounded-2xl border border-violet-500/15 bg-card/50 backdrop-blur-sm overflow-hidden">

      {/* header */}
      <div className="px-5 py-3.5 border-b border-border/40 bg-gradient-to-r from-violet-500/8 to-transparent flex items-center gap-2.5 flex-wrap">
        <div className="p-1.5 rounded-lg bg-violet-500/12 border border-violet-500/20">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-violet-500">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
        </div>
        <h2 className="text-sm font-semibold text-foreground">D3 force network · VIM</h2>
        <span className="text-xs text-muted-foreground">Drag · scroll to zoom · hover to trace</span>
        <button
          onClick={resetLayout}
          className="ml-auto text-[11px] px-3 py-1 rounded-full border border-border/50 text-muted-foreground hover:text-foreground hover:border-border transition-all"
        >
          Reset layout
        </button>
      </div>

      {/* filter pills */}
      <div className="flex flex-wrap gap-1.5 px-5 py-2.5 border-b border-border/30">
        {filters.map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`text-[11px] px-3 py-1 rounded-full border transition-all ${
              filter === f.key
                ? "bg-violet-500/10 border-violet-500/30 text-violet-600"
                : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
            }`}
          >{f.label}</button>
        ))}
      </div>

      {/* legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 px-5 py-2 border-b border-border/30 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="w-5 h-px bg-[#22c55e] inline-block"/>Positive</span>
        <span className="flex items-center gap-1.5"><span className="w-5 h-px bg-[#ef4444] inline-block"/>Negative</span>
        <span className="flex items-center gap-1.5"><span className="w-5 border-t border-[#22c55e] inline-block"/>Direct</span>
        <span className="flex items-center gap-1.5"><span className="w-5 border-t border-dashed border-[#ef4444] inline-block"/>Indirect</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-violet-500 inline-block"/>Factor</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-[3px] bg-indigo-500 inline-block"/>Domain</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 inline-block" style={{clipPath:"polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)", background:"#ec4899"}}/>Dimension</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block"/>SDG</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 ring-1 ring-amber-600 inline-block"/>Target</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"/>Indicator</span>
      </div>

      {/* canvas */}
      <div ref={wrapRef} className="relative">
        {tip && (
          <div
            className="absolute z-10 pointer-events-none rounded-xl border border-border/60 bg-card px-3 py-2.5 shadow-lg max-w-[230px] text-xs"
            style={{ left: tip.x, top: tip.y }}
            dangerouslySetInnerHTML={{ __html: tip.html }}
          />
        )}
        {!ready && (
          <div className="flex items-center justify-center h-[580px] text-sm text-muted-foreground">
            Loading D3…
          </div>
        )}
        <svg
          ref={svgRef}
          width="100%"
          viewBox="0 0 800 580"
          style={{ display: ready ? "block" : "none", cursor: "grab" }}
          role="img"
          aria-label="D3 force-directed VIM network with domain, dimension, SDG, target and indicator nodes"
        />
      </div>

      {/* distance slider */}
      <div className="flex items-center gap-3 px-5 py-3 border-t border-border/30 text-xs text-muted-foreground">
        <span className="whitespace-nowrap">Link distance</span>
        <input type="range" min={40} max={280} step={10} value={strength}
          onChange={(e) => setStrength(+e.target.value)}
          className="flex-1 accent-violet-500"
        />
        <span className="tabular-nums w-7 text-right">{strength}</span>
      </div>
    </div>
  );
};