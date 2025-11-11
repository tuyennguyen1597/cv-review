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
import { createOpenAI } from "@ai-sdk/openai";
import { getSystemParsedCvSectionsPrompt } from "@/utils/prompts/system-parsed-cv-sections";
import { CvSection, cvSectionSchema } from "@/schema/cv-section";
import { SelfQueryRetriever } from "langchain/retrievers/self_query";

export const runtime = "nodejs";

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

  const CvSections = await parseCvToSections(cvContent);

  const supabaseClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
    model: "text-embedding-3-small",
  });
  const model = new ChatOpenAI({
    model: "gpt-4o-mini",
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

  const aggregatedAnalysis: Record<string, SectionAnalysis> = {};
  const sectionEntries = Object.entries(CvSections).filter(
    ([, content]) => content.length >= 50
  );
  const tasks = sectionEntries.map(async ([section, content]) => {
    const docs = await retriever.invoke(content);
    const fullContext = formatDocumentsAsString(docs);
    const contextString =
      fullContext.length > 2000 ? fullContext.slice(0, 2000) : fullContext;
    const systemPrompt = getSystemAnalyzeCvPrompt().replace(
      "{context}",
      contextString
    );
    const userPrompt = getUserAnalyzeCvPrompt()
      .replace("{input}", content)
      .replace("{job_description}", jobDescription)
      .replace("{section_name}", section);
    const { object: analysis } = await generateObject({
      model: openai("gpt-4o-mini"),
      system: systemPrompt,
      prompt: userPrompt,
      schema: sectionAnalysisSchema,
    });
    aggregatedAnalysis[section] = analysis;
  });
  await Promise.all(tasks);

  const { object: finalScore } = await generateObject({
    model: openai("gpt-4o-mini"),
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

const metadataInfo = [
  {
    name: "category",
    description: `The category of the document. Can be one of: ['Common Mistakes', 'Tech-Specific', 'Action Verbs', 'Quantification Examples', 'Templates', 'Core Principles']`,
    type: "string",
  },
];
