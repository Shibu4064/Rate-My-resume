import type { Config, Context } from "@netlify/functions";
import { Pool } from "pg";
import OpenAI from "openai";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("localhost")
    ? false
    : { rejectUnauthorized: false },
});

type ResumeAnalysis = {
  overallScore: number;
  summary: string;
  strengths: string[];
  scoreBreakdown: Array<{
    category: string;
    score: number;
    maxScore: number;
    feedback: string;
  }>;
  suggestions: Array<{
    type: "critical" | "improvement" | "tip";
    title: string;
    description: string;
  }>;
  aiInsights: string;
};

async function extractText(buffer: Buffer, filename: string): Promise<string> {
  const lower = filename.toLowerCase();

  if (lower.endsWith(".pdf")) {
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (lower.endsWith(".docx")) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  return buffer.toString("utf-8");
}

function calcGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

function safeError(error: unknown) {
  const e = error as {
    name?: string;
    message?: string;
    status?: number;
    code?: string;
    type?: string;
  };

  return {
    name: e?.name,
    message: e?.message,
    status: e?.status,
    code: e?.code,
    type: e?.type,
  };
}

const resumeAnalysisSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "overallScore",
    "summary",
    "strengths",
    "scoreBreakdown",
    "suggestions",
    "aiInsights",
  ],
  properties: {
    overallScore: { type: "integer" },
    summary: { type: "string" },
    strengths: {
      type: "array",
      items: { type: "string" },
    },
    scoreBreakdown: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["category", "score", "maxScore", "feedback"],
        properties: {
          category: {
            type: "string",
            enum: [
              "Contact & Header",
              "Professional Summary",
              "Work Experience",
              "Skills & Keywords",
              "Education",
              "Formatting & Readability",
              "Quantifiable Achievements",
            ],
          },
          score: { type: "integer" },
          maxScore: { type: "integer" },
          feedback: { type: "string" },
        },
      },
    },
    suggestions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["type", "title", "description"],
        properties: {
          type: { type: "string", enum: ["critical", "improvement", "tip"] },
          title: { type: "string" },
          description: { type: "string" },
        },
      },
    },
    aiInsights: { type: "string" },
  },
} as const;

function normaliseAnalysis(analysis: ResumeAnalysis): ResumeAnalysis {
  const clamp = (value: number, min: number, max: number) =>
    Math.max(min, Math.min(max, Math.round(value)));

  return {
    ...analysis,
    overallScore: clamp(analysis.overallScore, 0, 100),
    scoreBreakdown: analysis.scoreBreakdown.map((item) => ({
      ...item,
      score: clamp(item.score, 0, item.maxScore),
    })),
  };
}

export default async function handler(req: Request, _ctx: Context) {
  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    console.error("OPENAI_API_KEY is missing or empty in Netlify Functions environment.");
    return Response.json(
      { error: "Server configuration error: OPENAI_API_KEY is missing." },
      { status: 500 }
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return Response.json({ error: "Invalid multipart form data" }, { status: 400 });
  }

  const fileEntry = formData.get("file");
  if (!fileEntry || typeof fileEntry === "string") {
    return Response.json({ error: "No file uploaded" }, { status: 400 });
  }

  const file = fileEntry as File;
  if (file.size > 5 * 1024 * 1024) {
    return Response.json({ error: "File is too large. Please upload a file under 5MB." }, { status: 400 });
  }

  const jobTitle = (formData.get("jobTitle") as string | null) || null;
  const industry = (formData.get("industry") as string | null) || null;

  let resumeText: string;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    resumeText = await extractText(buffer, file.name);
  } catch (error) {
    console.error("Resume text extraction failed:", safeError(error));
    return Response.json(
      { error: "Could not read file. Please upload a valid PDF, DOCX, or TXT file." },
      { status: 400 }
    );
  }

  if (!resumeText || resumeText.trim().length < 50) {
    return Response.json(
      { error: "The file appears empty or contains too little text." },
      { status: 400 }
    );
  }

  const contextClause =
    jobTitle || industry
      ? `The candidate targets the role of "${jobTitle || "unspecified"}" in the "${industry || "unspecified"}" industry.`
      : "No specific job target provided — perform a general assessment.";

  const systemPrompt =
    "You are an expert resume reviewer with 20 years of recruiting experience. Give honest, precise, ATS-aware, recruiter-style feedback.";

  const userPrompt = `Review this resume and return a detailed JSON analysis. ${contextClause}

Resume content:
---
${resumeText.slice(0, 8000)}
---

Scoring rules:
- overallScore must be 0-100.
- scoreBreakdown must contain exactly the seven requested categories.
- Make feedback specific to the resume, not generic.
- Suggestions must be directly actionable.`;

  let analysis: ResumeAnalysis;

  try {
    const openai = new OpenAI({ apiKey });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 2048,
      temperature: 0.2,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "resume_analysis",
          strict: true,
          schema: resumeAnalysisSchema,
        },
      },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) throw new Error("OpenAI returned an empty response.");

    analysis = normaliseAnalysis(JSON.parse(raw) as ResumeAnalysis);
  } catch (error) {
    const info = safeError(error);
    console.error("OpenAI resume analysis failed:", info);

    if (info.status === 401 || info.code === "invalid_api_key") {
      return Response.json(
        { error: "OpenAI API key is invalid, missing, expired, revoked, or contains extra spaces." },
        { status: 401 }
      );
    }

    if (info.status === 429 || info.code === "insufficient_quota") {
      return Response.json(
        { error: "OpenAI quota/rate limit issue. Check API billing, credits, project limits, and usage limits." },
        { status: 429 }
      );
    }

    if (info.status === 400) {
      return Response.json(
        { error: `OpenAI request error: ${info.message || "bad request"}` },
        { status: 400 }
      );
    }

    return Response.json(
      { error: "AI analysis failed. Check Netlify Function logs for the exact OpenAI error." },
      { status: 500 }
    );
  }

  const grade = calcGrade(analysis.overallScore);

  try {
    const result = await pool.query(
      `INSERT INTO resumes (file_name, job_title, industry, overall_score, grade, summary, strengths, score_breakdown, suggestions, ai_insights)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        file.name,
        jobTitle,
        industry,
        analysis.overallScore,
        grade,
        analysis.summary,
        JSON.stringify(analysis.strengths),
        JSON.stringify(analysis.scoreBreakdown),
        JSON.stringify(analysis.suggestions),
        analysis.aiInsights,
      ]
    );

    const row = result.rows[0];
    return Response.json({
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
    });
  } catch (error) {
    console.error("Database insert failed:", safeError(error));
    return Response.json({ error: "Database error. Check your DATABASE_URL and schema." }, { status: 500 });
  }
}

export const config: Config = {
  path: "/api/resumes/analyze",
  method: "POST",
};
