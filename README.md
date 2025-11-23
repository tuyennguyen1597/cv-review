## AI-Powered CV Review

AI-powered resume analyzer that:
- Extracts text from a PDF CV
- Parses it into sections (header, summary, experience, education, skills, projects, other)
- Retrieves best-practice context from a Supabase pgvector store
- Uses OpenAI to generate section-level feedback and an overall score
- Presents interactive feedback and highlights in a polished UI

### Tech stack
- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS 4, Radix UI
- **AI**: Vercel AI SDK (`ai`, `@ai-sdk/openai`), OpenAI (GPT-4o-mini, embeddings)
- **RAG**: LangChain, Supabase Vector Store (pgvector)
- **Parsing**: `pdf-parse` (server), `pdfjs-dist` (utility)
- **Validation**: `zod`

---

### Prerequisites
- Node.js 18+ (or compatible with Next.js 16)
- A Supabase project with pgvector enabled
- An OpenAI API key with access to GPT-4o-mini and `text-embedding-3-small`

---

### Environment variables
Create `.env.local` in the project root:

```env
# OpenAI
OPENAI_API_KEY=sk-...

# Supabase (server-side only; do NOT expose the service role key to the client)
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
```

Notes:
- `SUPABASE_SERVICE_ROLE_KEY` is used only by server-side API routes to write embeddings; keep it secret.
- The code references a `documents` table and an RPC `match_documents` function in Supabase (see setup below).

---

### Supabase vector store setup (pgvector)
Enable pgvector and create a minimal documents table and matching function.

```sql
-- Enable pgvector
create extension if not exists vector;

-- Embedding dimension for text-embedding-3-small is 1536
create table if not exists documents (
  id bigserial primary key,
  content text,
  metadata jsonb,
  embedding vector(1536)
);

-- Simple RPC to retrieve similar documents
create or replace function match_documents(
  query_embedding vector(1536),
  match_count int,
  filter jsonb default '{}'::jsonb
) returns table (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
) language plpgsql as $$
begin
  return query
  select d.id,
         d.content,
         d.metadata,
         1 - (d.embedding <=> query_embedding) as similarity
  from documents d
  where (filter = '{}'::jsonb or d.metadata @> filter)
  order by d.embedding <=> query_embedding
  limit match_count;
end;
$$;
```

---

### Install and run locally
```bash
npm install
npm run dev
```
Open `http://localhost:3000`.

Scripts:
- `npm run dev` – start dev server
- `npm run build` – production build
- `npm run start` – start production server
- `npm run lint` – run ESLint

---

### Using the app (UI)
1. Open the app and upload a PDF CV.
2. (Optional) Paste a job description to tailor the analysis.
3. Click “Analyze CV”.
4. Review:
   - Overall score (/100) and summary
   - Section highlights categorized as Strength, Needs Improvement, Missing, Suggestion
   - Toggle between PDF preview and highlights

Notes:
- PDFs are parsed on the server using `pdf-parse`.
- Inputs are trimmed to keep prompts bounded: context and per-section input are limited (~2000 chars).

---

### API reference

#### POST `/api/analyze-cv`
Analyze a PDF CV and (optionally) a job description.

Request (multipart/form-data):
- `file`: PDF file (required)
- `jobDescription`: string (optional)

Example:
```bash
curl -X POST http://localhost:3000/api/analyze-cv \
  -F "file=@/path/to/cv.pdf" \
  -F "jobDescription=Senior Frontend Engineer JD here..."
```

Response (200):
```json
{
  "analysis": {
    "overallFeedback": "string",
    "score": 0,
    "sectionAnalysis": {
      "summary": {
        "highlights": [
          {
            "text": "string",
            "comment": "string",
            "category": "strength | improvement | missing | suggestion",
            "startIndex": 0,
            "endIndex": 0
          }
        ]
      }
      /* ... other sections ... */
    }
  }
}
```

Dependencies and flow:
- Extract text from PDF (`pdf-parse`)
- Parse CV into sections via OpenAI (`gpt-4o-mini`) using a JSON schema (`zod`)
- Retrieve best-practice context from Supabase Vector Store (`match_documents`)
- Generate structured section analysis with Vercel AI SDK `generateObject` against `zod` schemas
- Compute final score/feedback with a separate model call

### Project structure (high-level)
- `app/` – Next.js App Router, UI, and API routes
  - `api/analyze-cv` – main analysis endpoint
  - `api/ingest` and `api/ingest/text` – ingest helpers for the RAG store
- `components/` – UI components (`cv-upload`, `cv-analyze`, shadcn-style UI)
- `schema/` – `zod` schemas for model-aligned JSON
- `utils/` – prompt builders and system/user prompts
- `lib/` – utilities (e.g., PDF parsing helper)

