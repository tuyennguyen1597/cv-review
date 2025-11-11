import { analysisSchema } from "@/schema/analyze-cv";
import { getSystemAnalyzeCvPrompt } from "@/utils/prompts/system-analyze-cv-prompt";
import { getUserAnalyzeCvPrompt } from "@/utils/prompts/user-analyze-cv-prompt";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { OpenAIEmbeddings } from "@langchain/openai";
import { createClient } from "@supabase/supabase-js";
import { formatDocumentsAsString } from "langchain/util/document";
import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

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

  const supabaseClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
    model: "text-embedding-3-small",
  });

  const vectorStore = new SupabaseVectorStore(embeddings, {
    client: supabaseClient,
    tableName: "documents",
    queryName: "match_documents",
  });
  const retriever = vectorStore.asRetriever();

  const docs = await retriever.invoke(cvContent);
  console.log("docs", docs);
  const contextString = formatDocumentsAsString(docs);
  console.log("contextString", contextString);
  // Build prompts
  const system = getSystemAnalyzeCvPrompt().replace("{context}", contextString);
  const user = getUserAnalyzeCvPrompt()
    .replace("{input}", cvContent)
    .replace("{job_description}", jobDescription);

  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const { object: analysis } = await generateObject({
    model: openai("gpt-4o-mini"),
    system,
    prompt: user,
    schema: analysisSchema,
  });

  console.log("result", analysis);
  return NextResponse.json({ analysis }, { status: 200 });
}
