import type { Config, Context } from "@netlify/functions";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("localhost")
    ? false
    : { rejectUnauthorized: false },
});

function rowToResume(row: Record<string, unknown>) {
  return {
    id: row.id,
    fileName: row.file_name,
    jobTitle: row.job_title,
    industry: row.industry,
    overallScore: row.overall_score,
    grade: row.grade,
    summary: row.summary,
    strengths: row.strengths,
    scoreBreakdown: row.score_breakdown,
    suggestions: row.suggestions,
    aiInsights: row.ai_insights,
    createdAt: row.created_at,
  };
}

export default async function handler(_req: Request, _ctx: Context) {
  try {
    const result = await pool.query(
      "SELECT * FROM resumes ORDER BY created_at DESC"
    );
    return Response.json(result.rows.map(rowToResume));
  } catch {
    return Response.json({ error: "Database error. Check your DATABASE_URL." }, { status: 500 });
  }
}

export const config: Config = {
  path: "/api/resumes",
  method: "GET",
};
