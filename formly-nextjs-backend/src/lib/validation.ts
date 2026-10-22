
import { z } from "zod";

export const questionSchema = z.object({
  id: z.string().min(1).max(100),
  type: z.enum(["text", "email", "choice", "yesno"]),
  label: z.string().trim().min(1).max(500),
  required: z.boolean().default(false),
  options: z
    .array(z.string().trim().min(1).max(200))
    .max(50)
    .optional(),
});

export const formSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().max(2000).default(""),
  status: z.enum(["Published", "Draft"]).default("Draft"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#7156e8"),
  welcome: z.string().max(2000).default(""),
  questions: z.array(questionSchema).max(100).default([]),
});

export const submissionSchema = z.object({
  answers: z.record(z.string(), z.string().max(10000)),
  source: z
    .enum(["Public link", "Website widget"])
    .default("Public link"),
});
