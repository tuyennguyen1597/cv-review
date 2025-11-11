import { z } from "zod";
const highlightSchema = z.object({
  text: z.string().describe("The exact text from the CV being highlighted"),
  comment: z.string().describe("Detailed feedback about this section"),
  category: z.enum(["strength", "improvement", "missing", "suggestion"]),
  startIndex: z.number().describe("Character index where highlight starts"),
  endIndex: z.number().describe("Character index where highlight ends"),
});

export const sectionAnalysisSchema = z.object({
  highlights: z
    .array(highlightSchema)
    .describe("Specific sections with feedback"),
});
export type SectionAnalysis = z.infer<typeof sectionAnalysisSchema>;

export const analysisSchema = z.object({
  overallFeedback: z
    .string()
    .describe("Comprehensive overall feedback about the CV"),
  score: z.number().min(0).max(100).describe("Overall CV score out of 100"),
  sectionAnalysis: z
    .record(z.string(), sectionAnalysisSchema)
    .describe("The analysis of each section"),
});

export type CVAnalysisResponse = z.infer<typeof analysisSchema>;
