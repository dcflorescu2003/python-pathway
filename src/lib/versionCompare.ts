/** Compară versiuni de tip "1.232" segment cu segment. Returnează -1, 0 sau 1. */
export function compareVersions(a: string, b: string): number {
  const pa = String(a || "0").trim().split(".").map((x) => parseInt(x, 10) || 0);
  const pb = String(b || "0").trim().split(".").map((x) => parseInt(x, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d > 0 ? 1 : -1;
  }
  return 0;
}
