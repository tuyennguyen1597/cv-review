import { getSystemAnalyzeCvPrompt } from "../prompts/system-analyze-cv-prompt";
import { getUserAnalyzeCvPrompt } from "../prompts/user-analyze-cv-prompt";

export const buildAnalyzeCvPrompts = (args: {
  context: string;
  input: string;
  jobDescription: string;
  section: string;
}) => {
  const systemPrompt = getSystemAnalyzeCvPrompt().replace(
    "{context}",
    args.context
  );
  const userPrompt = getUserAnalyzeCvPrompt()
    .replace("{input}", args.input)
    .replace("{job_description}", args.jobDescription)
    .replace("{section_name}", args.section);
  return { systemPrompt, userPrompt };
};
