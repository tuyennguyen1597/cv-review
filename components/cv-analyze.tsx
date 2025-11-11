"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Info,
  TrendingUp,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { JSX } from "react/jsx-runtime"; // Import JSX to resolve undeclared variable error

interface Highlight {
  text: string;
  comment: string;
  category: "strength" | "improvement" | "missing" | "suggestion";
  startIndex: number;
  endIndex: number;
}

interface AnalysisProps {
  analysis: {
    overallFeedback: string;
    score: number;
    highlights: Highlight[];
    cvText: string;
  };
  onReset: () => void;
  fileUrl: string | null;
  jobDescription: string;
}

const categoryConfig = {
  strength: {
    label: "Strength",
    icon: CheckCircle2,
    color: "text-green-600",
    bgColor: "bg-green-100",
    borderColor: "border-green-300",
  },
  improvement: {
    label: "Needs Improvement",
    icon: AlertCircle,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
    borderColor: "border-orange-300",
  },
  missing: {
    label: "Missing",
    icon: AlertCircle,
    color: "text-red-600",
    bgColor: "bg-red-100",
    borderColor: "border-red-300",
  },
  suggestion: {
    label: "Suggestion",
    icon: Info,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    borderColor: "border-blue-300",
  },
};

export function CVAnalysis({
  analysis,
  onReset,
  fileUrl,
  jobDescription,
}: AnalysisProps) {
  const [selectedHighlight, setSelectedHighlight] = useState<Highlight | null>(
    null
  );
  const [pdfError, setPdfError] = useState(false);

  const renderCVWithHighlights = () => {
    const { cvText, highlights } = analysis;
    const sortedHighlights = [...highlights].sort(
      (a, b) => a.startIndex - b.startIndex
    );

    const parts: JSX.Element[] = [];
    let lastIndex = 0;

    sortedHighlights.forEach((highlight, idx) => {
      if (highlight.startIndex > lastIndex) {
        parts.push(
          <span key={`text-${idx}`}>
            {cvText.slice(lastIndex, highlight.startIndex)}
          </span>
        );
      }

      const config = categoryConfig[highlight.category];
      parts.push(
        <mark
          key={`highlight-${idx}`}
          className={cn(
            "cursor-pointer rounded px-1 transition-all hover:ring-2",
            config.bgColor,
            selectedHighlight === highlight && "ring-2 ring-primary"
          )}
          onClick={() => setSelectedHighlight(highlight)}
        >
          {cvText.slice(highlight.startIndex, highlight.endIndex)}
        </mark>
      );

      lastIndex = highlight.endIndex;
    });

    if (lastIndex < cvText.length) {
      parts.push(<span key="text-end">{cvText.slice(lastIndex)}</span>);
    }

    return parts;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-orange-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onReset}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Analyze Another CV
        </Button>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="mb-2 text-2xl font-bold">Overall Score</h2>
            <p className="text-muted-foreground">
              Based on content quality and job fit
            </p>
          </div>
          <div className="flex items-center gap-3">
            <TrendingUp
              className={cn("h-8 w-8", getScoreColor(analysis.score))}
            />
            <span
              className={cn(
                "text-5xl font-bold",
                getScoreColor(analysis.score)
              )}
            >
              {analysis.score}
            </span>
            <span className="text-2xl text-muted-foreground">/100</span>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 text-xl font-bold">Summary</h2>
        <p className="leading-relaxed text-foreground">
          {analysis.overallFeedback}
        </p>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <Tabs defaultValue="pdf" className="w-full">
            <TabsList className="mb-4 grid w-full grid-cols-2">
              <TabsTrigger value="pdf">
                <FileText className="mr-2 h-4 w-4" />
                PDF View
              </TabsTrigger>
              <TabsTrigger value="highlights">
                <Info className="mr-2 h-4 w-4" />
                Highlights
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pdf" className="mt-0">
              {fileUrl ? (
                <div className="space-y-4">
                  <div className="relative h-[800px] w-full overflow-hidden rounded-lg border border-border bg-muted/30">
                    <iframe
                      src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                      className="h-full w-full"
                      title="CV PDF"
                      onError={() => {
                        console.log("[v0] PDF iframe failed to load");
                        setPdfError(true);
                      }}
                    />
                  </div>
                  {pdfError && (
                    <div className="rounded-lg border border-orange-300 bg-orange-50 p-4">
                      <p className="mb-2 text-sm text-orange-800">
                        PDF preview is not available in your browser.
                      </p>
                      <Button asChild variant="outline" size="sm">
                        <a href={fileUrl} download="cv.pdf">
                          Download PDF to View
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex h-[800px] items-center justify-center rounded-lg border border-border bg-muted/30">
                  <p className="text-muted-foreground">
                    PDF preview not available
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="highlights" className="mt-0">
              <div className="h-[800px] overflow-y-auto rounded-lg border border-border bg-muted/30 p-6">
                <div className="space-y-4">
                  {analysis.highlights.map((highlight, idx) => {
                    const config = categoryConfig[highlight.category];
                    const Icon = config.icon;
                    return (
                      <div
                        key={idx}
                        className={cn(
                          "cursor-pointer rounded-lg border p-4 transition-all hover:shadow-md",
                          config.borderColor,
                          selectedHighlight === highlight &&
                            "ring-2 ring-primary"
                        )}
                        onClick={() => setSelectedHighlight(highlight)}
                      >
                        <div className="mb-2 flex items-center gap-2">
                          <Icon
                            className={cn("mt-0.5 h-4 w-4", config.color)}
                          />
                          <Badge
                            variant="secondary"
                            className={cn(config.bgColor, config.color)}
                          >
                            {config.label}
                          </Badge>
                        </div>
                        <p className="mb-2 text-sm font-medium text-foreground">
                          &quot;{highlight.text}&quot;
                        </p>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {highlight.comment}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        <div className="space-y-6">
          {selectedHighlight && (
            <Card className="p-6">
              <h3 className="mb-3 text-lg font-semibold">Selected Feedback</h3>
              <div className="mb-3 flex items-start gap-2">
                {(() => {
                  const config = categoryConfig[selectedHighlight.category];
                  const Icon = config.icon;
                  return (
                    <>
                      <Icon className={cn("mt-0.5 h-5 w-5", config.color)} />
                      <div className="flex-1">
                        <Badge
                          variant="secondary"
                          className={cn(config.bgColor, config.color)}
                        >
                          {config.label}
                        </Badge>
                      </div>
                    </>
                  );
                })()}
              </div>
              <p className="mb-3 text-sm font-medium text-foreground">
                &quot;{selectedHighlight.text}&quot;
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {selectedHighlight.comment}
              </p>
            </Card>
          )}

          <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold">Feedback Summary</h3>
            <div className="space-y-3">
              {Object.entries(categoryConfig).map(([key, config]) => {
                const count = analysis.highlights.filter(
                  (h) => h.category === key
                ).length;
                const Icon = config.icon;
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={cn("h-4 w-4", config.color)} />
                      <span className="text-sm font-medium">
                        {config.label}
                      </span>
                    </div>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
