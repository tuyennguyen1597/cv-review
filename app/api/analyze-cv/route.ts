import {
  analysisSchema,
  CVAnalysisResponse,
  SectionAnalysis,
  sectionAnalysisSchema,
} from "@/schema/analyze-cv";
import {
  getSystemAnalyzeCvPrompt,
  getSystemFinalScorePrompt,
} from "@/utils/prompts/system-analyze-cv-prompt";
import {
  getUserAnalyzeCvPrompt,
  getUserParseCvPrompt,
} from "@/utils/prompts/user-analyze-cv-prompt";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { SupabaseTranslator } from "@langchain/community/structured_query/supabase";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { createClient } from "@supabase/supabase-js";
import { formatDocumentsAsString } from "langchain/util/document";
import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { createOpenAI, openai } from "@ai-sdk/openai";
import { getSystemParsedCvSectionsPrompt } from "@/utils/prompts/system-parsed-cv-sections";
import { CvSection, cvSectionSchema } from "@/schema/cv-section";
import { SelfQueryRetriever } from "langchain/retrievers/self_query";
import { buildAnalyzeCvPrompts } from "@/utils/builders/build-prompts";
export const runtime = "nodejs";

const MAX_CONTEXT_CHARS = 2000;
const RETRIEVER_K = 3;
const MODEL_CHAT = "gpt-4o-mini";
const EMBEDDING_MODEL = "text-embedding-3-small";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  const jobDescription = formData.get("jobDescription") as string;

  if (!file) {
    return NextResponse.json({ error: "No File Uploaded" }, { status: 400 });
  }

  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const { default: pdfParse } = await import("pdf-parse/lib/pdf-parse.js");
  const pdfData = await pdfParse(fileBuffer);
  const cvContent = pdfData.text;

  // PARSE THE CV INTO SECTIONS
  console.log("Parsing CV into sections...");
  const CvSections = await parseCvToSections(cvContent);

  // CREATE THE SUPABASE CLIENT
  console.log("Creating Supabase client...");
  const supabaseClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
    model: EMBEDDING_MODEL,
  });
  const model = new ChatOpenAI({
    model: MODEL_CHAT,
    apiKey: process.env.OPENAI_API_KEY,
  });

  const vectorStore = new SupabaseVectorStore(embeddings, {
    client: supabaseClient,
    tableName: "documents",
    queryName: "match_documents",
  });
  const retriever = SelfQueryRetriever.fromLLM({
    llm: model,
    vectorStore,
    documentContents: "Best practices for writing a CV section",
    attributeInfo: metadataInfo,
    structuredQueryTranslator: new SupabaseTranslator(),
  });

  // ANALYZE EACH SECTION OF THE CV
  console.log("Analyzing each section of the CV...");
  const aggregatedAnalysis: Record<string, SectionAnalysis> = {};
  const sectionEntries = Object.entries(CvSections).filter(
    ([, content]) => content.length >= 50
  );
  const tasks = sectionEntries.map(async ([section, content]) => {
    const docs = await retriever.invoke(content);
    const fullContext = formatDocumentsAsString(docs);
    const contextString =
      fullContext.length > MAX_CONTEXT_CHARS
        ? fullContext.slice(0, MAX_CONTEXT_CHARS)
        : fullContext;

    const analysis = await analyzeSectionCv({
      contextString,
      input: content,
      jobDescription,
      section,
    });
    aggregatedAnalysis[section] = analysis;
  });
  await Promise.all(tasks);

  // CALCULATE THE FINAL SCORE
  console.log("Calculating the final score...");
  const { object: finalScore } = await generateObject({
    model: openai(MODEL_CHAT),
    prompt: getSystemFinalScorePrompt(aggregatedAnalysis),
    schema: analysisSchema.pick({ overallFeedback: true, score: true }),
  });

  const finalResponse: CVAnalysisResponse = {
    ...finalScore,
    sectionAnalysis: aggregatedAnalysis,
  };

  return NextResponse.json({ analysis: finalResponse }, { status: 200 });
}

const parseCvToSections = async (cvContent: string): Promise<CvSection> => {
  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const userPrompt = getUserParseCvPrompt().replace("{cv_text}", cvContent);
  const systemPrompt = getSystemParsedCvSectionsPrompt();
  const { object: cvSections } = await generateObject({
    model: openai("gpt-4o-mini"),
    system: systemPrompt,
    prompt: userPrompt,
    schema: cvSectionSchema,
  });

  return cvSections;
};

const analyzeSectionCv = async (params: {
  contextString: string;
  input: string;
  jobDescription: string;
  section: string;
}) => {
  const { systemPrompt, userPrompt } = buildAnalyzeCvPrompts({
    context: params.contextString,
    input: params.input,
    jobDescription: params.jobDescription,
    section: params.section,
  });
  const { object: analysis } = await generateObject({
    model: openai(MODEL_CHAT),
    system: systemPrompt,
    prompt: userPrompt,
    schema: sectionAnalysisSchema,
  });
  return analysis;
};

const metadataInfo = [
  {
    name: "category",
    description: `The category of the document. Can be one of: ['Common Mistakes', 'Tech-Specific', 'Action Verbs', 'Quantification Examples', 'Templates', 'Core Principles']`,
    type: "string",
  },
];
