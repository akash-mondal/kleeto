import { cn } from "@/lib/utils";

export type TableColumn = {
  label: string;
  /** Small uppercase line under the column name, e.g. `MICROVM`. */
  sub?: string;
};

export type TableRow = {
  label: string;
  cells: readonly string[];
};

/**
 * Benchmark / isolation comparison table. The first data column is Solari and
 * is always rendered in amber.
 */
export function ComparisonTable({
  columns,
  rows,
  className,
}: {
  columns: readonly TableColumn[];
  rows: readonly TableRow[];
  className?: string;
}) {
  return (
    <div className={cn("overflow-x-auto rounded-[4px] border border-white/10", className)}>
      <table className="w-full min-w-[720px] border-collapse text-left">
        <thead>
          <tr className="border-b border-white/10">
            <th className="w-[190px] px-5 py-5" />
            {columns.map((column, index) => (
              <th key={column.label} className="px-5 py-5 align-top font-normal">
                <span
                  className={cn(
                    "block text-[13px]",
                    index === 0 ? "text-sol-accent" : "text-[#e7e7e2]",
                  )}
                >
                  {column.label}
                </span>
                {column.sub ? (
                  <span
                    className={cn(
                      "mt-1 block font-mono text-[9px] tracking-[0.16em] uppercase",
                      index === 0 ? "text-sol-accent/70" : "text-sol-muted",
                    )}
                  >
                    {column.sub}
                  </span>
                ) : null}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-white/10 last:border-b-0">
              <th scope="row" className="px-5 py-5 align-top text-[13px] font-normal text-[#e7e7e2]">
                {row.label}
              </th>
              {row.cells.map((cell, index) => (
                <td
                  key={`${row.label}-${index}`}
                  className={cn(
                    "px-5 py-5 align-top text-[13px] leading-[1.4]",
                    index === 0 ? "text-sol-accent" : "text-sol-muted",
                  )}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
