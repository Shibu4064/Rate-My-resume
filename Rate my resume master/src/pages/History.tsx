import React from "react";
import { Link } from "wouter";
import { useListResumes, useGetResumeStats, useDeleteResume, getListResumesQueryKey, getGetResumeStatsQueryKey } from "@/api/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Trash2, ArrowRight, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function History() {
  const { data: resumes, isLoading } = useListResumes();
  const { data: stats, isLoading: isLoadingStats } = useGetResumeStats();
  const deleteMutation = useDeleteResume();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleDelete = (id: number) => {
    deleteMutation.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Resume deleted" });
        queryClient.invalidateQueries({ queryKey: getListResumesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetResumeStatsQueryKey() });
      },
      onError: (err) => {
        toast({ title: "Failed to delete", description: err.error, variant: "destructive" });
      }
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Analysis History</h1>
        <p className="text-muted-foreground">Review your past resumes and track your improvement.</p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="py-4">
            <CardDescription className="font-medium">Total Analyzed</CardDescription>
            <CardTitle className="text-3xl">{isLoadingStats ? <Skeleton className="h-8 w-16" /> : stats?.totalAnalyzed || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="py-4">
            <CardDescription className="font-medium">Average Score</CardDescription>
            <CardTitle className="text-3xl text-primary">{isLoadingStats ? <Skeleton className="h-8 w-16" /> : Math.round(stats?.averageScore || 0)}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader className="py-4">
            <CardDescription className="font-medium">Top Missing Sections</CardDescription>
            <div className="flex flex-wrap gap-2 mt-2">
              {isLoadingStats ? (
                <><Skeleton className="h-6 w-20" /><Skeleton className="h-6 w-24" /></>
              ) : stats?.topIssues.length ? (
                stats.topIssues.map((issue, i) => <Badge key={i} variant="secondary" className="text-xs">{issue}</Badge>)
              ) : (
                <span className="text-sm text-muted-foreground">Not enough data yet.</span>
              )}
            </div>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>All Resumes</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
          ) : resumes && resumes.length > 0 ? (
            <div className="rounded-md border">
              {resumes.map((resume, idx) => (
                <div key={resume.id} className={`flex items-center justify-between p-4 ${idx !== resumes.length - 1 ? "border-b" : ""}`}>
                  <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-bold text-lg ${resume.overallScore >= 80 ? 'bg-green-100 text-green-700' : resume.overallScore >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                      {resume.overallScore}
                    </div>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {resume.fileName}
                        <Badge variant="outline" className="text-[10px] py-0 h-4 uppercase">{resume.grade}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                        {format(new Date(resume.createdAt), "MMM d, yyyy h:mm a")}
                        {resume.jobTitle && <span>• {resume.jobTitle}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this analysis?</AlertDialogTitle>
                          <AlertDialogDescription>This action cannot be undone. This will permanently delete your resume analysis data.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(resume.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <Link href={`/results/${resume.id}`}>
                      <Button variant="secondary" size="sm" className="gap-2">View <ArrowRight className="h-3 w-3" /></Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-medium">No resumes analyzed yet</h3>
              <p className="text-muted-foreground mb-6">Upload your first resume to see it here.</p>
              <Link href="/"><Button>Analyze a Resume</Button></Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
