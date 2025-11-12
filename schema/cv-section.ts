import { z } from "zod";

export const cvSectionSchema = z.object({
  header: z
    .string()
    .optional()
    .nullable()
    .describe(
      "All text at the top of the CV before any formal section, like name, phone, email, LinkedIn."
    ),
  summary: z
    .string()
    .optional()
    .nullable()
    .describe("The 'Professional Summary', 'Summary', or 'About' section."),
  experience: z
    .string()
    .optional()
    .describe(
      "The 'Experience', 'Work History', or 'Professional Experience' section."
    ),
  education: z
    .string()
    .optional()
    .nullable()
    .describe("The 'Education' or 'Certifications' section."),
  skills: z
    .string()
    .optional()
    .nullable()
    .describe("The 'Skills' or 'Technical Skills' section."),
  projects: z
    .string()
    .optional()
    .nullable()
    .describe("The 'Projects' or 'Personal Projects' section."),
  other: z
    .string()
    .optional()
    .nullable()
    .describe(
      "Any other text that doesn't fit into the above categories, like 'Interests' or 'References'."
    ),
});

export type CvSection = z.infer<typeof cvSectionSchema>;
