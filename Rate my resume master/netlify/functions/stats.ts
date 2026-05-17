import type { Config, Context } from "@netlify/functions";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("localhost")
    ? false
    : { rejectUnauthorized: false },
});

export default async function handler(_req: Request, _ctx: Context) {
  try {
    const result = await pool.query("SELECT overall_score, suggestions FROM resumes");
    const rows = result.rows;

    const totalAnalyzed = rows.length;
    const averageScore =
      totalAnalyzed > 0
        ? rows.reduce((sum: number, r: Record<string, unknown>) => sum + (r.overall_score as number), 0) / totalAnalyzed
        : 0;

    const scoreDistribution = {
      excellent: rows.filter((r: Record<string, unknown>) => (r.overall_score as number) >= 80).length,
      good: rows.filter((r: Record<string, unknown>) => (r.overall_score as number) >= 60 && (r.overall_score as number) < 80).length,
      fair: rows.filter((r: Record<string, unknown>) => (r.overall_score as number) >= 40 && (r.overall_score as number) < 60).length,
      poor: rows.filter((r: Record<string, unknown>) => (r.overall_score as number) < 40).length,
    };

    const issueCounts: Record<string, number> = {};
    for (const r of rows) {
      const suggestions = (r.suggestions as Array<{ type: string; title: string }>) || [];
      for (const s of suggestions) {
        if (s.type === "critical") {
          issueCounts[s.title] = (issueCounts[s.title] ?? 0) + 1;
        }
      }
    }

    const topIssues = Object.entries(issueCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([title]) => title);

    return Response.json({
      totalAnalyzed,
      averageScore: Math.round(averageScore * 10) / 10,
      scoreDistribution,
      topIssues,
    });
  } catch {
    return Response.json({ error: "Database error. Check your DATABASE_URL." }, { status: 500 });
  }
}

export const config: Config = {
  path: "/api/resumes/stats",
  method: "GET",
};
