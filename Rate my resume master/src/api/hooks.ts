import {
  useQuery,
  useMutation,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ScoreBreakdownItem = {
  category: string;
  score: number;
  maxScore: number;
  feedback: string;
};

export type Suggestion = {
  type: "critical" | "improvement" | "tip";
  title: string;
  description: string;
};

export type ResumeAnalysis = {
  id: number;
  fileName: string;
  jobTitle: string | null;
  industry: string | null;
  overallScore: number;
  grade: string;
  summary: string;
  strengths: string[];
  scoreBreakdown: ScoreBreakdownItem[];
  suggestions: Suggestion[];
  aiInsights: string;
  createdAt: string;
};

export type ResumeStats = {
  totalAnalyzed: number;
  averageScore: number;
  scoreDistribution: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
  topIssues: string[];
};

export type ErrorResponse = { error: string };

// ─── Query Key Factories ───────────────────────────────────────────────────────

export const getListResumesQueryKey = () => ["resumes"] as const;
export const getGetResumeQueryKey = (id: number) => ["resumes", id] as const;
export const getGetResumeStatsQueryKey = () => ["resumes-stats"] as const;

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useListResumes<TData = ResumeAnalysis[]>(options?: {
  query?: Omit<
    UseQueryOptions<ResumeAnalysis[], ErrorResponse, TData>,
    "queryKey" | "queryFn"
  >;
}) {
  return useQuery<ResumeAnalysis[], ErrorResponse, TData>({
    queryKey: getListResumesQueryKey(),
    queryFn: async () => {
      const res = await fetch("/api/resumes");
      if (!res.ok) throw (await res.json()) as ErrorResponse;
      return res.json() as Promise<ResumeAnalysis[]>;
    },
    ...(options?.query as object),
  });
}

export function useGetResume(
  id: number,
  options?: {
    query?: Partial<
      UseQueryOptions<ResumeAnalysis, ErrorResponse>
    >;
  }
) {
  return useQuery<ResumeAnalysis, ErrorResponse>({
    queryKey: getGetResumeQueryKey(id),
    queryFn: async () => {
      const res = await fetch(`/api/resumes/${id}`);
      if (!res.ok) throw (await res.json()) as ErrorResponse;
      return res.json() as Promise<ResumeAnalysis>;
    },
    ...(options?.query as object),
  });
}

export function useGetResumeStats(options?: {
  query?: Partial<UseQueryOptions<ResumeStats, ErrorResponse>>;
}) {
  return useQuery<ResumeStats, ErrorResponse>({
    queryKey: getGetResumeStatsQueryKey(),
    queryFn: async () => {
      const res = await fetch("/api/resumes/stats");
      if (!res.ok) throw (await res.json()) as ErrorResponse;
      return res.json() as Promise<ResumeStats>;
    },
    ...(options?.query as object),
  });
}

type AnalyzeInput = {
  data: { file: File; jobTitle?: string; industry?: string };
};

export function useAnalyzeResume(options?: {
  mutation?: UseMutationOptions<ResumeAnalysis, ErrorResponse, AnalyzeInput>;
}) {
  return useMutation<ResumeAnalysis, ErrorResponse, AnalyzeInput>({
    mutationFn: async ({ data }) => {
      const formData = new FormData();
      formData.append("file", data.file);
      if (data.jobTitle) formData.append("jobTitle", data.jobTitle);
      if (data.industry) formData.append("industry", data.industry);

      const res = await fetch("/api/resumes/analyze", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw (await res.json()) as ErrorResponse;
      return res.json() as Promise<ResumeAnalysis>;
    },
    ...options?.mutation,
  });
}

export function useDeleteResume(options?: {
  mutation?: UseMutationOptions<
    { success: boolean },
    ErrorResponse,
    { id: number }
  >;
}) {
  return useMutation<{ success: boolean }, ErrorResponse, { id: number }>({
    mutationFn: async ({ id }) => {
      const res = await fetch(`/api/resumes/${id}`, { method: "DELETE" });
      if (!res.ok) throw (await res.json()) as ErrorResponse;
      return res.json() as Promise<{ success: boolean }>;
    },
    ...options?.mutation,
  });
}
