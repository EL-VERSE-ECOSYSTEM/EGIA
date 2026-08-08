import { z } from "zod";

export const questionSchema = z.object({
  questionText: z.string().trim().min(5),
  questionType: z.enum(["MULTIPLE_CHOICE_SINGLE", "MULTIPLE_CHOICE_MULTIPLE", "FILL_IN_THE_BLANK", "TRUE_FALSE"]),
  options: z.array(z.string().trim().min(1)).min(2),
  correctAnswer: z.string().trim().min(1),
  points: z.coerce.number().int().min(1).max(10),
  explanation: z.string().trim().max(2_000).optional(),
});
export type QuestionFormData = z.infer<typeof questionSchema>;
