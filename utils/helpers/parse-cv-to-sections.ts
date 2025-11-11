export const parseCvToSections = (cvText: string) => {
  const sections = cvText.split("\n\n");
  return sections.map((section) => ({
    title: section.split("\n")[0],
    content: section.split("\n").slice(1).join("\n"),
  }));
};
