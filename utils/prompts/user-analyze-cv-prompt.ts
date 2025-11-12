export const getUserAnalyzeCvPrompt = () => `Job Description:
    \`\`\`text
    {job_description}
    \`\`\`
    
    CV Section to Analyze ({section_name}):
    \`\`\`text
    {input}
    \`\`\``;

export const getUserParseCvPrompt = () => `Parse the following CV text:
    \`\`\`text
    {cv_text}
    \`\`\`
    
    Respond ONLY with a valid JSON object matching the expected schema (no prose).`;
