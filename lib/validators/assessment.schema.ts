import { z } from "zod";

export const assessmentSchema = z.object({
  title: z.string().trim().min(5).max(255),
  description: z.string().trim().max(2_000).optional(),
  type: z.enum(["WEEKEND_QUIZ", "MID_TERM", "EXAMINATION", "CBT", "ASSIGNMENT", "TEST"]),
  subjectId: z.string().min(1, "Select a subject"),
  classArmId: z.string().min(1).optional(),
  totalScore: z.number().min(1).max(100),
  passingScore: z.number().min(0).max(100),
  durationMinutes: z.number().int().min(10).max(180),
  dueDate: z.string().datetime().optional(),
  instructions: z.string().trim().max(5_000).optional(),
});
export type AssessmentFormData = z.infer<typeof assessmentSchema>;
