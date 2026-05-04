import type {
  CompilerBenchmarkHistory,
  CompilerBenchmarkResult,
} from "@typespec/spec-coverage-sdk";
import { FunctionComponent, useState } from "react";
import { useEffectAsync } from "../utils.js";

export interface BenchmarkDashboardFromAzureStorageProps {
  /** Name of the Azure Storage account hosting the benchmark data. */
  storageAccountName: string;
  /** Container name where benchmark data is stored. Defaults to "coverages". */
  containerName?: string;
}

const BENCHMARK_HISTORY_BLOB = "compiler-benchmarks/history.json";

/** Loads and displays the TypeSpec compiler benchmark dashboard from Azure Blob Storage. */
export const BenchmarkDashboardFromAzureStorage: FunctionComponent<
  BenchmarkDashboardFromAzureStorageProps
> = ({ storageAccountName, containerName = "coverages" }) => {
  const [history, setHistory] = useState<CompilerBenchmarkHistory | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffectAsync(async () => {
    try {
      const url = `https://${storageAccountName}.blob.core.windows.net/${containerName}/${BENCHMARK_HISTORY_BLOB}`;
      const res = await fetch(url);
      if (!res.ok) {
        if (res.status === 404) {
          setHistory({ results: [] });
        } else {
          setError(`Failed to load benchmark data: ${res.statusText}`);
        }
        return;
      }
      const data: CompilerBenchmarkHistory = await res.json();
      setHistory(data);
    } catch (e) {
      setError(`Failed to load benchmark data: ${String(e)}`);
    }
  }, [storageAccountName, containerName]);

  if (error) {
    return <div style={{ color: "red", padding: "16px" }}>{error}</div>;
  }

  if (history === undefined) {
    return <div style={{ padding: "16px" }}>Loading…</div>;
  }

  if (history.results.length === 0) {
    return <div style={{ padding: "16px" }}>No benchmark data available yet.</div>;
  }

  return <BenchmarkDashboard history={history} />;
};

export interface BenchmarkDashboardProps {
  history: CompilerBenchmarkHistory;
}

/** Renders a benchmark chart with commits on the x-axis. */
export const BenchmarkDashboard: FunctionComponent<BenchmarkDashboardProps> = ({ history }) => {
  return (
    <div style={{ padding: "24px" }}>
      <h2 style={{ marginBottom: "8px" }}>TypeSpec Compiler Benchmarks</h2>
      <p style={{ marginBottom: "24px", color: "var(--colorNeutralForeground2, #666)" }}>
        Compilation time per commit. Each data point corresponds to a specific git commit.
      </p>
      <BenchmarkChart results={history.results} />
    </div>
  );
};

interface BenchmarkChartProps {
  results: CompilerBenchmarkResult[];
}

const CHART_WIDTH = 900;
const CHART_HEIGHT = 400;
const PADDING = { top: 20, right: 20, bottom: 80, left: 70 };

const COLORS: Record<string, string> = {
  total: "#0078d4",
  loader: "#00b7c3",
  resolver: "#8764b8",
  checker: "#d13438",
  validation: "#107c10",
  linter: "#ff8c00",
};

const METRIC_LABELS: Record<string, string> = {
  total: "Total",
  loader: "Loader",
  resolver: "Resolver",
  checker: "Checker",
  validation: "Validation",
  linter: "Linter",
};

/** SVG-based benchmark chart that uses commit SHAs on the x-axis. */
const BenchmarkChart: FunctionComponent<BenchmarkChartProps> = ({ results }) => {
  const plotWidth = CHART_WIDTH - PADDING.left - PADDING.right;
  const plotHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  const metrics = Object.keys(COLORS) as (keyof typeof COLORS)[];

  // Find the max value across all metrics.
  let maxValue = 0;
  for (const r of results) {
    for (const metric of metrics) {
      const v = r.metrics[metric as keyof typeof r.metrics] ?? 0;
      if (v > maxValue) maxValue = v;
    }
  }
  // Round up to a nice ceiling.
  const yMax = Math.ceil(maxValue / 100) * 100 || 100;

  const n = results.length;
  const xStep = n > 1 ? plotWidth / (n - 1) : plotWidth;
  const xPos = (i: number) => PADDING.left + (n > 1 ? i * xStep : plotWidth / 2);
  const yPos = (v: number) => PADDING.top + plotHeight - (v / yMax) * plotHeight;

  // Y-axis grid lines (5 ticks).
  const yTicks = Array.from({ length: 6 }, (_, i) => (yMax / 5) * i);

  // Build polyline points for each metric.
  const lines = metrics.map((metric) => {
    const points = results
      .map((r, i) => {
        const v = r.metrics[metric as keyof typeof r.metrics] ?? 0;
        return `${xPos(i)},${yPos(v)}`;
      })
      .join(" ");
    return { metric, points };
  });

  return (
    <div style={{ overflowX: "auto" }}>
      <svg
        width={CHART_WIDTH}
        height={CHART_HEIGHT}
        style={{ fontFamily: "var(--fontFamilyBase, sans-serif)", fontSize: 11 }}
        role="img"
        aria-label="Compiler benchmark chart with commits on x-axis"
      >
        {/* Y-axis grid & labels */}
        {yTicks.map((tick) => (
          <g key={tick}>
            <line
              x1={PADDING.left}
              y1={yPos(tick)}
              x2={PADDING.left + plotWidth}
              y2={yPos(tick)}
              stroke="#e0e0e0"
              strokeDasharray="4 2"
            />
            <text
              x={PADDING.left - 6}
              y={yPos(tick) + 4}
              textAnchor="end"
              fill="var(--colorNeutralForeground2, #555)"
            >
              {tick}ms
            </text>
          </g>
        ))}

        {/* X-axis baseline */}
        <line
          x1={PADDING.left}
          y1={PADDING.top + plotHeight}
          x2={PADDING.left + plotWidth}
          y2={PADDING.top + plotHeight}
          stroke="#ccc"
        />

        {/* Y-axis baseline */}
        <line
          x1={PADDING.left}
          y1={PADDING.top}
          x2={PADDING.left}
          y2={PADDING.top + plotHeight}
          stroke="#ccc"
        />

        {/* X-axis commit labels */}
        {results.map((r, i) => (
          <text
            key={r.commit}
            x={xPos(i)}
            y={PADDING.top + plotHeight + 16}
            textAnchor="end"
            transform={`rotate(-45, ${xPos(i)}, ${PADDING.top + plotHeight + 16})`}
            fill="var(--colorNeutralForeground2, #555)"
          >
            {r.commit.slice(0, 8)}
          </text>
        ))}

        {/* Data lines */}
        {lines.map(({ metric, points }) => (
          <polyline
            key={metric}
            points={points}
            fill="none"
            stroke={COLORS[metric]}
            strokeWidth={2}
          />
        ))}

        {/* Data points */}
        {metrics.map((metric) =>
          results.map((r, i) => {
            const v = r.metrics[metric as keyof typeof r.metrics] ?? 0;
            return (
              <circle key={`${metric}-${i}`} cx={xPos(i)} cy={yPos(v)} r={3} fill={COLORS[metric]}>
                <title>
                  {METRIC_LABELS[metric]}: {v}ms — commit {r.commit.slice(0, 8)} (
                  {new Date(r.date).toLocaleDateString()})
                </title>
              </circle>
            );
          }),
        )}

        {/* Y-axis label */}
        <text
          x={16}
          y={PADDING.top + plotHeight / 2}
          textAnchor="middle"
          transform={`rotate(-90, 16, ${PADDING.top + plotHeight / 2})`}
          fill="var(--colorNeutralForeground2, #555)"
        >
          Duration (ms)
        </text>

        {/* X-axis label */}
        <text
          x={PADDING.left + plotWidth / 2}
          y={CHART_HEIGHT - 4}
          textAnchor="middle"
          fill="var(--colorNeutralForeground2, #555)"
        >
          Commit
        </text>
      </svg>

      {/* Legend */}
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginTop: "8px" }}>
        {metrics.map((metric) => (
          <span key={metric} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <svg width={16} height={4} aria-hidden="true">
              <line x1={0} y1={2} x2={16} y2={2} stroke={COLORS[metric]} strokeWidth={2} />
            </svg>
            <span style={{ color: "var(--colorNeutralForeground1, #000)" }}>
              {METRIC_LABELS[metric]}
            </span>
          </span>
        ))}
      </div>

      {/* Accessible data table for screen readers */}
      <details style={{ marginTop: "16px" }}>
        <summary style={{ cursor: "pointer", color: "var(--colorNeutralForeground2, #666)" }}>
          View data table
        </summary>
        <table
          style={{ borderCollapse: "collapse", marginTop: "8px", fontSize: "12px", width: "100%" }}
        >
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "4px 8px", borderBottom: "1px solid #ccc" }}>
                Commit
              </th>
              <th style={{ textAlign: "left", padding: "4px 8px", borderBottom: "1px solid #ccc" }}>
                Date
              </th>
              {metrics.map((m) => (
                <th
                  key={m}
                  style={{
                    textAlign: "right",
                    padding: "4px 8px",
                    borderBottom: "1px solid #ccc",
                  }}
                >
                  {METRIC_LABELS[m]} (ms)
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.commit}>
                <td style={{ padding: "4px 8px", fontFamily: "monospace" }}>
                  {r.commit.slice(0, 8)}
                </td>
                <td style={{ padding: "4px 8px" }}>{new Date(r.date).toLocaleDateString()}</td>
                {metrics.map((m) => (
                  <td key={m} style={{ textAlign: "right", padding: "4px 8px" }}>
                    {r.metrics[m as keyof typeof r.metrics] ?? 0}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
};
