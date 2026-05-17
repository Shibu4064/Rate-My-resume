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

export default async function handler(req: Request, ctx: Context) {
  const id = parseInt(ctx.params.id, 10);
  if (isNaN(id)) {
    return Response.json({ error: "Invalid ID" }, { status: 400 });
  }

  if (req.method === "GET") {
    try {
      const result = await pool.query("SELECT * FROM resumes WHERE id = $1", [id]);
      if (result.rows.length === 0) {
        return Response.json({ error: "Resume not found" }, { status: 404 });
      }
      return Response.json(rowToResume(result.rows[0]));
    } catch {
      return Response.json({ error: "Database error. Check your DATABASE_URL." }, { status: 500 });
    }
  }

  if (req.method === "DELETE") {
    try {
      const result = await pool.query(
        "DELETE FROM resumes WHERE id = $1 RETURNING id",
        [id]
      );
      if (result.rows.length === 0) {
        return Response.json({ error: "Resume not found" }, { status: 404 });
      }
      return Response.json({ success: true });
    } catch {
      return Response.json({ error: "Database error. Check your DATABASE_URL." }, { status: 500 });
    }
  }

  return Response.json({ error: "Method not allowed" }, { status: 405 });
}

export const config: Config = {
  path: "/api/resumes/:id",
  method: ["GET", "DELETE"],
};
