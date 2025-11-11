// app/api/ingest/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

/**
 * This API route handles ingesting content from a URL into the Supabase vector store.
 **/
export async function POST(req: Request) {
  const { context, category } = await req.json();

  if (!context) {
    return NextResponse.json({ error: "Context is required" }, { status: 400 });
  }

  const documentCategory = category || "general";
  try {
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const documentWithMetadata = new Document({
      pageContent: context,
      metadata: {
        category: documentCategory,
      },
    });
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 50,
    });
    const splitDocs = await splitter.splitDocuments([documentWithMetadata]);

    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    // 5. Embed the chunks and store them in Supabase
    await SupabaseVectorStore.fromDocuments(splitDocs, embeddings, {
      client: supabaseClient,
      tableName: "documents",
      queryName: "match_documents",
    });

    // 6. Respond with success
    return NextResponse.json({
      message: "Successfully ingested document.",
      context: context,
      docCount: splitDocs.length,
    });
  } catch (error) {
    console.error("Ingestion error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to ingest document.", details: errorMessage },
      { status: 500 }
    );
  }
}
