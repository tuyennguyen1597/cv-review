"use client";
import { useState } from "react";
import { FileText, Sparkles, Upload } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CVUpload } from "@/components/cv-upload";
import { type CVAnalysisResponse } from "@/schema/analyze-cv";
import { CVAnalysis as CVAnalysisComponent } from "@/components/cv-analyze";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [analysis, setAnalysis] = useState<CVAnalysisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!file) return;

    setIsAnalyzing(true);

    try {
      const url = URL.createObjectURL(file);
      setFileUrl(url);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("jobDescription", jobDescription);

      const response = await fetch("/api/analyze-cv", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("[v0] API error:", errorData);
        throw new Error(errorData.error || "Failed to analyze CV");
      }

      const result = await response.json();
      console.log(result);
      setAnalysis(result.analysis);
    } catch (error) {
      alert("Failed to analyze CV. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* HEADER */}
        <div className="mb-12  text-center">
          <div className="mb-4 inline-flex items-center justify-center rounded-full bg-primary/10 p-3">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h1 className="mb-3 text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            AI-Powered CV Review
          </h1>
          <p className="text-pretty text-lg text-muted-foreground">
            Upload your resume and get detailed feedback tailored to your target
            job
          </p>
        </div>
      </div>

      {!analysis ? (
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Upload Section */}
          <Card className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Upload Your CV</h2>
            </div>
            <CVUpload file={file} onFileChange={setFile} />
          </Card>

          {/* Job Description Section */}
          <Card className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">
                Job Description (Optional)
              </h2>
            </div>
            <Textarea
              placeholder="Paste the job description here to get tailored feedback..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="min-h-[200px] resize-none"
            />
            <p className="mt-2 text-sm text-muted-foreground">
              Adding a job description helps the AI provide more specific
              recommendations
            </p>
          </Card>

          {/* Analyze Button */}
          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={handleAnalyze}
              disabled={!file || isAnalyzing}
              className="min-w-[200px]"
            >
              {isAnalyzing ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Analyze CV
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <CVAnalysisComponent
          analysis={analysis}
          onReset={() => setAnalysis(null)}
          fileUrl={fileUrl}
          jobDescription={jobDescription}
        />
      )}
    </main>
  );
}
