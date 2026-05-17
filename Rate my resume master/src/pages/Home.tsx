import React, { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Upload, FileText, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { useAnalyzeResume, useListResumes, getListResumesQueryKey } from "@/api/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [jobTitle, setJobTitle] = useState("");
  const [industry, setIndustry] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const analyzeMutation = useAnalyzeResume({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListResumesQueryKey() });
        setLocation(`/results/${data.id}`);
      },
      onError: (err) => {
        toast({
          title: "Analysis Failed",
          description: err.error || "Failed to analyze resume. Please try again.",
          variant: "destructive"
        });
      }
    }
  });

  const { data: recentResumes, isLoading: isLoadingRecent } = useListResumes({
    query: {
      select: (data) => data.slice(0, 3)
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.type === "application/pdf" || selected.name.endsWith(".docx")) {
        setFile(selected);
      } else {
        toast({ title: "Invalid file type", description: "Please upload a PDF or DOCX file.", variant: "destructive" });
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      if (selected.type === "application/pdf" || selected.name.endsWith(".docx")) {
        setFile(selected);
      } else {
        toast({ title: "Invalid file type", description: "Please upload a PDF or DOCX file.", variant: "destructive" });
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    analyzeMutation.mutate({ data: { file, jobTitle: jobTitle || undefined, industry: industry || undefined } });
  };

  return (
    <div className="container mx-auto px-4 py-12 md:py-24 max-w-5xl">
      <div className="text-center mb-12 space-y-4">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
          Get the brutal truth about your resume.
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Upload your resume. Get an AI-powered score, detailed breakdown, and actionable insights to land your next role. No fluff.
        </p>
      </div>

      <div className="grid md:grid-cols-5 gap-8 items-start">
        <div className="md:col-span-3">
          <Card className="border-2 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Analyze Resume</CardTitle>
              <CardDescription>Upload your PDF or DOCX resume to get started. Optional context helps improve the analysis.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${file ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                  {file ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <CheckCircle2 className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-semibold text-lg">{file.name}</p>
                        <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      <Button variant="outline" size="sm" type="button" onClick={(e) => { e.stopPropagation(); setFile(null); }}>Remove</Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                        <Upload className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold text-lg">Click to upload or drag and drop</p>
                        <p className="text-sm text-muted-foreground">PDF or DOCX (max 5MB)</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="jobTitle">Target Job Title (Optional)</Label>
                    <Input id="jobTitle" placeholder="e.g. Senior Frontend Engineer" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry (Optional)</Label>
                    <Input id="industry" placeholder="e.g. Tech, Finance" value={industry} onChange={(e) => setIndustry(e.target.value)} />
                  </div>
                </div>

                <Button type="submit" className="w-full h-14 text-lg font-bold" disabled={!file || analyzeMutation.isPending}>
                  {analyzeMutation.isPending ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Analyzing (This takes a moment)...</>
                  ) : (
                    <>Analyze My Resume <ArrowRight className="ml-2 h-5 w-5" /></>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Analyses</CardTitle>
              <CardDescription>Your previously analyzed resumes</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingRecent ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : recentResumes && recentResumes.length > 0 ? (
                <div className="space-y-4">
                  {recentResumes.map((resume) => (
                    <div key={resume.id} className="group flex items-center justify-between p-3 rounded-lg border hover:border-primary transition-colors cursor-pointer" onClick={() => setLocation(`/results/${resume.id}`)}>
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="h-10 w-10 shrink-0 rounded bg-muted flex items-center justify-center">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-medium text-sm truncate">{resume.fileName}</p>
                          <p className="text-xs text-muted-foreground truncate">{new Date(resume.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="shrink-0 flex flex-col items-end">
                        <span className={`font-bold text-lg ${resume.overallScore >= 80 ? 'text-green-600' : resume.overallScore >= 60 ? 'text-amber-600' : 'text-red-600'}`}>{resume.overallScore}</span>
                        <Badge variant="outline" className="text-[10px] uppercase">Grade {resume.grade}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">No previous analyses found.</div>
              )}
            </CardContent>
            {recentResumes && recentResumes.length > 0 && (
              <CardFooter className="pt-0">
                <Button variant="ghost" className="w-full text-sm" onClick={() => setLocation('/history')}>View All History</Button>
              </CardFooter>
            )}
          </Card>

          <Card className="bg-primary text-primary-foreground border-none">
            <CardContent className="p-6">
              <h3 className="font-bold text-lg mb-2">Why use Rate My Resume?</h3>
              <ul className="space-y-2 text-sm text-primary-foreground/90">
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" /> Stop guessing if your resume is good enough.</li>
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" /> Get actionable feedback, not generic advice.</li>
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" /> AI trained on thousands of successful resumes.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
