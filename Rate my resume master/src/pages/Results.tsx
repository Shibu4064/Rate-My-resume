import React from "react";
import { useParams, Link } from "wouter";
import { useGetResume } from "@/api/hooks";
import { Loader2, ArrowLeft, AlertTriangle, CheckCircle, Lightbulb, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function Results() {
  const params = useParams();
  const id = params.id ? parseInt(params.id) : 0;

  const { data: resume, isLoading, error } = useGetResume(id, {
    query: { enabled: !!id }
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <h2 className="text-xl font-medium text-muted-foreground">Loading your analysis...</h2>
      </div>
    );
  }

  if (error || !resume) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-3xl text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Analysis not found</h1>
        <p className="text-muted-foreground mb-6">We couldn't find the resume analysis you're looking for.</p>
        <Link href="/"><Button>Return Home</Button></Link>
      </div>
    );
  }

  const scoreColor = resume.overallScore >= 80 ? "text-green-500" : resume.overallScore >= 60 ? "text-amber-500" : "text-destructive";

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-8">
      <div className="flex items-center justify-between">
        <Link href="/">
          <Button variant="ghost" className="gap-2 -ml-4"><ArrowLeft className="h-4 w-4" /> Back</Button>
        </Link>
        <div className="text-sm text-muted-foreground">Analyzed on {new Date(resume.createdAt).toLocaleDateString()}</div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 border-2 text-center p-6 flex flex-col items-center justify-center">
          <h2 className="text-lg font-medium text-muted-foreground mb-4">Overall Score</h2>
          <div className={`text-7xl font-extrabold mb-2 ${scoreColor}`}>{resume.overallScore}</div>
          <p className="text-sm font-medium text-muted-foreground mb-6">out of 100</p>
          <div className="w-full flex items-center justify-between px-4 py-3 bg-muted rounded-lg">
            <span className="font-semibold text-sm uppercase tracking-wider">Letter Grade</span>
            <span className="text-2xl font-black">{resume.grade}</span>
          </div>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl mb-1">{resume.fileName}</CardTitle>
                <CardDescription>
                  {resume.jobTitle && <span className="font-medium text-foreground">Role: {resume.jobTitle}</span>}
                  {resume.jobTitle && resume.industry && " • "}
                  {resume.industry && <span className="font-medium text-foreground">Industry: {resume.industry}</span>}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <h3 className="font-semibold text-lg mb-2">Executive Summary</h3>
            <p className="text-muted-foreground leading-relaxed">{resume.summary}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /> Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {resume.scoreBreakdown.map((item, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{item.category}</span>
                  <span className="text-muted-foreground">{item.score}/{item.maxScore}</span>
                </div>
                <Progress
                  value={(item.score / item.maxScore) * 100}
                  className="h-2"
                  indicatorColor={
                    (item.score / item.maxScore) >= 0.8 ? "bg-green-500" :
                    (item.score / item.maxScore) >= 0.6 ? "bg-amber-500" : "bg-destructive"
                  }
                />
                <p className="text-xs text-muted-foreground">{item.feedback}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-green-600"><CheckCircle className="h-5 w-5" /> Key Strengths</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {resume.strengths.map((strength, idx) => (
                  <li key={idx} className="flex gap-3 text-sm">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-primary"><Lightbulb className="h-5 w-5" /> AI Deep Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{resume.aiInsights}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Actionable Suggestions</CardTitle>
          <CardDescription>Fix these issues to improve your score and get more interviews.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {resume.suggestions.map((suggestion, idx) => {
            const isCritical = suggestion.type === "critical";
            const isImprovement = suggestion.type === "improvement";
            return (
              <div key={idx} className={`p-4 rounded-lg border-l-4 ${isCritical ? "border-l-destructive bg-destructive/5" : isImprovement ? "border-l-amber-500 bg-amber-500/5" : "border-l-primary bg-primary/5"}`}>
                <div className="flex items-start gap-3">
                  <Badge variant={isCritical ? "destructive" : isImprovement ? "secondary" : "default"} className="mt-0.5 shrink-0 uppercase text-[10px]">
                    {suggestion.type}
                  </Badge>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">{suggestion.title}</h4>
                    <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
