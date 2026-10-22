export type QuestionType = "text" | "email" | "choice" | "yesno";

export type FormQuestion = {
  id: number;
  type: QuestionType;
  label: string;
  required: boolean;
  options?: string[];
};

export type FormRecord = {
  id: string;
  title: string;
  description: string;
  status: "Published" | "Draft";
  color: string;
  welcome: string;
  questions: FormQuestion[];
  created_at: string;
  updated_at: string;
  response_count?: number;
};

export type SubmissionInput = {
  answers: Record<string, string>;
  source?: "Public link" | "Website widget";
};

export type ApiError = { error: string };
