import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, TrendingUp, TrendingDown, Minus, Info } from "lucide-react";
import { VimNetworkDiagram } from "@/components/VimNetworkDiagram";
import { VimD3Network } from "@/components/VimD3Network";

// ─── SDG color palette (UN official) ───────────────────────────────────────
const sdgColorMap: Record<string, { bg: string; text: string; dot: string }> = {
  "SDG 1 - No Poverty":                    { bg: "bg-[#e5243b]",  text: "text-white", dot: "#e5243b" },
  "SDG 2 - Zero Hunger":                   { bg: "bg-[#dda63a]",  text: "text-white", dot: "#dda63a" },
  "SDG 3 - Good Health and Well-Being":    { bg: "bg-[#4c9f38]",  text: "text-white", dot: "#4c9f38" },
  "SDG 4 - Quality Education":             { bg: "bg-[#c5192d]",  text: "text-white", dot: "#c5192d" },
  "SDG 5 - Gender Equality":               { bg: "bg-[#ff3a21]",  text: "text-white", dot: "#ff3a21" },
  "SDG 6 - Clean Water and Sanitation":    { bg: "bg-[#26bde2]",  text: "text-white", dot: "#26bde2" },
  "SDG 7 - Affordable and Clean Energy":   { bg: "bg-[#fcc30b]",  text: "text-black", dot: "#fcc30b" },
  "SDG 8 - Decent Work and Economic Growth": { bg: "bg-[#a21942]", text: "text-white", dot: "#a21942" },
  "SDG 9 - Industry, Innovation":          { bg: "bg-[#fd6925]",  text: "text-white", dot: "#fd6925" },
  "SDG 10 - Reduced Inequalities":         { bg: "bg-[#dd1367]",  text: "text-white", dot: "#dd1367" },
  "SDG 11 - Sustainable Cities":           { bg: "bg-[#fd9d24]",  text: "text-white", dot: "#fd9d24" },
  "SDG 12 - Responsible Consumption":      { bg: "bg-[#bf8b2e]",  text: "text-white", dot: "#bf8b2e" },
  "SDG 13 - Climate Action":               { bg: "bg-[#3f7e44]",  text: "text-white", dot: "#3f7e44" },
  "SDG 15 - Life on Land":                 { bg: "bg-[#56c02b]",  text: "text-white", dot: "#56c02b" },
  "SDG 16 - Peace, Justice":               { bg: "bg-[#00689d]",  text: "text-white", dot: "#00689d" },
  "SDG 17 - Partnerships":                 { bg: "bg-[#19486a]",  text: "text-white", dot: "#19486a" },
};

const getSdgStyle = (sdg: string) =>
  sdgColorMap[sdg] ?? { bg: "bg-slate-500", text: "text-white", dot: "#64748b" };

// ─── Polarity badge ─────────────────────────────────────────────────────────
const PolarityBadge = ({ polarity }: { polarity: string }) => {
  const lower = polarity?.toLowerCase();
  if (lower === "negative")
    return (
      <Badge className="bg-rose-500/12 text-rose-500 border border-rose-500/25 gap-1 font-medium">
        <TrendingDown className="w-3 h-3" /> Negative
      </Badge>
    );
  if (lower === "positive")
    return (
      <Badge className="bg-emerald-500/12 text-emerald-500 border border-emerald-500/25 gap-1 font-medium">
        <TrendingUp className="w-3 h-3" /> Positive
      </Badge>
    );
  return (
    <Badge className="bg-slate-500/12 text-slate-500 border border-slate-500/25 gap-1 font-medium">
      <Minus className="w-3 h-3" /> {polarity}
    </Badge>
  );
};

// ─── Directness badge ────────────────────────────────────────────────────────
const DirectnessBadge = ({ directness }: { directness: string }) => {
  const lower = directness?.toLowerCase();
  const styles =
    lower === "direct"
      ? "bg-violet-500/10 text-violet-600 border-violet-500/25"
      : "bg-amber-500/10 text-amber-600 border-amber-500/25";
  return (
    <Badge variant="outline" className={`text-xs font-medium capitalize ${styles}`}>
      {directness}
    </Badge>
  );
};

// ─── Expandable row detail panel ─────────────────────────────────────────────
const ExpandedDetail = ({ row }: { row: any }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-violet-500/[0.03] border-t border-violet-500/10">
    {row.influence_affect && (
      <Detail label="Influence Affect" value={row.influence_affect} />
    )}
    {row.target && (
      <Detail label="SDG Target" value={row.target} mono />
    )}
    {row.indicator && (
      <Detail label="Indicator" value={row.indicator} />
    )}
    {row.domain && (
      <Detail label="Domain" value={row.domain} />
    )}
    {row.evidence && (
      <Detail label="Evidence" value={row.evidence} wide />
    )}
    {row.mapping_reason && (
      <Detail label="Mapping Reason" value={row.mapping_reason} wide />
    )}
  </div>
);

const Detail = ({
  label,
  value,
  mono,
  wide,
}: {
  label: string;
  value: string;
  mono?: boolean;
  wide?: boolean;
}) => (
  <div className={wide ? "sm:col-span-2" : ""}>
    <p className="text-[10px] font-bold text-violet-500/60 uppercase tracking-widest mb-1">{label}</p>
    <p className={`text-sm text-foreground leading-relaxed ${mono ? "font-mono text-xs" : ""}`}>{value}</p>
  </div>
);

// ─── Impact Diagram ──────────────────────────────────────────────────────────
const ImpactDiagram = ({ data }: { data: any[] }) => {
  const [hovered, setHovered] = useState<number | null>(null);

  // Group by domain
  const byDomain: Record<string, any[]> = {};
  data.forEach((row) => {
    const domain = row.domain || "Other";
    if (!byDomain[domain]) byDomain[domain] = [];
    byDomain[domain].push(row);
  });

  // SDG frequency map
  const sdgCounts: Record<string, { count: number; positives: number; negatives: number; color: string }> = {};
  data.forEach((row) => {
    if (!row.sdg) return;
    if (!sdgCounts[row.sdg]) {
      sdgCounts[row.sdg] = {
        count: 0,
        positives: 0,
        negatives: 0,
        color: getSdgStyle(row.sdg).dot,
      };
    }
    sdgCounts[row.sdg].count++;
    if (row.polarity?.toLowerCase() === "positive") sdgCounts[row.sdg].positives++;
    if (row.polarity?.toLowerCase() === "negative") sdgCounts[row.sdg].negatives++;
  });

  const sdgEntries = Object.entries(sdgCounts).sort((a, b) => b[1].count - a[1].count);
  const maxCount = Math.max(...sdgEntries.map(([, v]) => v.count), 1);

  const positiveCount = data.filter((r) => r.polarity?.toLowerCase() === "positive").length;
  const negativeCount = data.filter((r) => r.polarity?.toLowerCase() === "negative").length;
  const directCount = data.filter((r) => r.directness?.toLowerCase() === "direct").length;

  return (
    <div className="rounded-2xl border border-violet-500/15 bg-card/50 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-border/40 bg-gradient-to-r from-violet-500/8 to-transparent flex items-center gap-2.5">
        <div className="p-1.5 rounded-lg bg-violet-500/12 border border-violet-500/20">
          <Info className="w-3.5 h-3.5 text-violet-500" />
        </div>
        <h2 className="text-sm font-semibold text-foreground">VIM Impact Diagram</h2>
        <span className="ml-auto text-xs text-muted-foreground">{data.length} factors mapped</span>
      </div>

      <div className="p-5 space-y-6">
        {/* Summary pills */}
        <div className="flex flex-wrap gap-3">
          <SummaryPill
            label="Positive"
            count={positiveCount}
            total={data.length}
            color="emerald"
          />
          <SummaryPill
            label="Negative"
            count={negativeCount}
            total={data.length}
            color="rose"
          />
          <SummaryPill
            label="Direct"
            count={directCount}
            total={data.length}
            color="violet"
          />
          <SummaryPill
            label="SDGs Affected"
            count={sdgEntries.length}
            total={17}
            color="amber"
          />
        </div>

        {/* SDG bar chart */}
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
            SDG Impact Distribution
          </p>
          <div className="space-y-2">
            {sdgEntries.map(([sdg, vals], i) => {
              const pct = (vals.count / maxCount) * 100;
              const posW = vals.count ? (vals.positives / vals.count) * pct : 0;
              const negW = vals.count ? (vals.negatives / vals.count) * pct : 0;
              const isHov = hovered === i;
              return (
                <div
                  key={sdg}
                  className={`group transition-all duration-200 rounded-lg p-2 cursor-default ${
                    isHov ? "bg-violet-500/6" : "hover:bg-muted/30"
                  }`}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: vals.color }}
                    />
                    <span className="text-xs font-medium text-foreground truncate flex-1">{sdg}</span>
                    <span className="text-xs tabular-nums text-muted-foreground ml-2">{vals.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted/40 overflow-hidden flex">
                    <div
                      className="h-full rounded-l-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${posW}%` }}
                    />
                    <div
                      className="h-full bg-rose-500 transition-all duration-500"
                      style={{ width: `${negW}%` }}
                    />
                    <div
                      className="h-full rounded-r-full bg-slate-400/50 transition-all duration-500"
                      style={{ width: `${pct - posW - negW}%` }}
                    />
                  </div>
                  {isHov && (
                    <div className="flex gap-3 mt-1.5 text-[10px] text-muted-foreground">
                      <span className="text-emerald-500">▲ {vals.positives} positive</span>
                      <span className="text-rose-500">▼ {vals.negatives} negative</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 mt-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />Positive</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />Negative</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-400/50 inline-block" />Neutral</span>
          </div>
        </div>

        {/* Domain breakdown */}
        {Object.keys(byDomain).length > 1 && (
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
              Factors by Domain
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(byDomain).map(([domain, rows]) => (
                <div
                  key={domain}
                  className="flex items-center gap-1.5 rounded-full border border-border/50 bg-muted/30 px-3 py-1 text-xs"
                >
                  <span className="font-medium text-foreground">{domain}</span>
                  <span className="text-muted-foreground">{rows.length}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const SummaryPill = ({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: "emerald" | "rose" | "violet" | "amber";
}) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const styles = {
    emerald: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    rose: "bg-rose-500/10 text-rose-600 border-rose-500/20",
    violet: "bg-violet-500/10 text-violet-600 border-violet-500/20",
    amber: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  };
  return (
    <div className={`flex flex-col rounded-xl border px-4 py-2.5 min-w-[90px] ${styles[color]}`}>
      <span className="text-xl font-black tabular-nums leading-none">{count}</span>
      <span className="text-[10px] font-semibold uppercase tracking-wider mt-0.5 opacity-70">{label}</span>
      {total !== count && (
        <span className="text-[10px] tabular-nums opacity-50">{pct}% of {total}</span>
      )}
    </div>
  );
};

// ─── Main VimTable export ────────────────────────────────────────────────────
export const VimTable = ({ data }: { data: any[] }) => {
  const [expanded, setExpanded] = useState<Set<string | number>>(new Set());

  if (!data || data.length === 0) return null;

  const toggle = (id: string | number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const hasExpandable = (row: any) =>
    row.influence_affect || row.target || row.indicator || row.domain || row.evidence || row.mapping_reason;

  return (
    <div className="space-y-4">
      {/* ── Table card ── */}
      <div className="rounded-2xl border border-violet-500/15 bg-card/50 backdrop-blur-sm overflow-hidden">
        {/* Card header */}
        <div className="px-5 py-3.5 border-b border-border/40 bg-gradient-to-r from-violet-500/8 to-transparent flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-violet-500/12 border border-violet-500/20">
            <Info className="w-3.5 h-3.5 text-violet-500" />
          </div>
          <h2 className="text-sm font-semibold text-foreground">VIM Extraction Results</h2>
          <Badge variant="outline" className="ml-auto text-xs bg-violet-500/8 border-violet-500/20 text-violet-600">
            {data.length} factors
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="w-6 pl-4" />
                <TableHead className="font-semibold text-xs uppercase tracking-wide">Influence Factor</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide">SDG</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide">Polarity</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide">Directness</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide">Dimension</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, idx) => {
                const rowId = row.id ?? idx;
                const isOpen = expanded.has(rowId);
                const sdgStyle = getSdgStyle(row.sdg);
                const canExpand = hasExpandable(row);

                return (
                  <>
                    <TableRow
                      key={`row-${rowId}`}
                      className={`transition-colors duration-150 ${
                        canExpand ? "cursor-pointer" : ""
                      } ${isOpen ? "bg-violet-500/[0.04]" : "hover:bg-muted/30"}`}
                      onClick={() => canExpand && toggle(rowId)}
                    >
                      <TableCell className="pl-4 pr-0 w-6">
                        {canExpand ? (
                          isOpen ? (
                            <ChevronDown className="w-3.5 h-3.5 text-violet-500" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                          )
                        ) : null}
                      </TableCell>

                      <TableCell className="font-medium max-w-[180px]">
                        <span className="block truncate text-sm" title={row.influence_factor}>
                          {row.influence_factor}
                        </span>
                      </TableCell>

                      <TableCell>
                        {row.sdg ? (
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${sdgStyle.bg} ${sdgStyle.text}`}
                          >
                            {row.sdg}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>

                      <TableCell>
                        <PolarityBadge polarity={row.polarity} />
                      </TableCell>

                      <TableCell>
                        {row.directness ? (
                          <DirectnessBadge directness={row.directness} />
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>

                      <TableCell className="text-muted-foreground text-xs max-w-[200px]">
                        <span className="block truncate" title={row.dimension}>
                          {row.dimension || "—"}
                        </span>
                      </TableCell>
                    </TableRow>

                    {isOpen && canExpand && (
                      <TableRow key={`expanded-${rowId}`} className="bg-violet-500/[0.02] hover:bg-violet-500/[0.04]">
                        <TableCell colSpan={6} className="p-0">
                          <ExpandedDetail row={row} />
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {data.some((r) => hasExpandable(r)) && (
          <div className="px-5 py-2.5 border-t border-border/30 bg-muted/20">
            <p className="text-[10px] text-muted-foreground">
              Click any row to expand full details · {data.filter((r) => hasExpandable(r)).length} rows expandable
            </p>
          </div>
        )}
      </div>

      {/* ── Impact Diagram ── */}
      <ImpactDiagram data={data} />

      {/* ── Network Diagram ── */}
      <VimNetworkDiagram data={data} />

      {/* ── D3 Force Network ── */}
      <VimD3Network data={data} />
    </div>
  );
};