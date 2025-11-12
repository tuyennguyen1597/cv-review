import { SectionAnalysis } from "@/schema/analyze-cv";

export const getSystemAnalyzeCvPrompt =
  () => `You are an expert career coach. Analyze the given CV section based *only* on the provided context, the section text, and the job description.
    
    For this section, identify:
    - Strengths: What's done well
    - Improvements: What could be better
    - Missing: Important elements that are absent
    - Suggestions: Specific recommendations
    
    Output requirements:
    - Respond ONLY with a valid JSON object that conforms to the expected schema.
    - Do NOT include any additional prose, explanations, comments, or markdown.
    - Ensure all string fields contain ONLY section text or feedback, with no embedded objects.
    
    Retrieved Context (fenced):
    \`\`\`text
    {context}
    \`\`\``;

export const getSystemFinalScorePrompt = (
  aggregatedAnalysis: Record<string, SectionAnalysis>
) =>
  `You are a master career coach. You have already analyzed each section of a CV.
    Now, provide an overall score (0-100) and a brief justification based on the 5 criteria:
    1. Content quality and relevance
    2. Structure and formatting
    3. Achievement quantification
    4. Keyword optimization
    5. Professional presentation
    
    Here is the detailed section-by-section analysis:
    ${JSON.stringify(aggregatedAnalysis, null, 2)}
    
    Respond *only* with the final JSON object.`;
