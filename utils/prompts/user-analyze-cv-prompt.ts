export const getUserAnalyzeCvPrompt = () => `Job Description:
    {job_description}
    
    CV Section to Analyze ({section_name}):
    {input}`;

export const getUserParseCvPrompt = () => `Parse the following CV text:
    {cv_text}
    `;
