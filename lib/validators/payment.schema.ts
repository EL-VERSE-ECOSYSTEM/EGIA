import { z } from "zod";

export const paymentSchema = z.object({
  amount: z.coerce.number().min(100, "Minimum payment is ₦100"),
  feeType: z.enum(["TUITION", "DEVELOPMENT", "EXAM", "SPORTS", "PTA", "LIBRARY", "ICT", "UNIFORM", "BOARDING"]),
  studentId: z.string().uuid(),
  paymentMethod: z.enum(["CARD", "BANK_TRANSFER", "USSD", "QR"]),
  installmentPlan: z.boolean().default(false),
  installments: z.coerce.number().int().min(2).max(12).optional(),
}).superRefine((value, context) => {
  if (value.installmentPlan && !value.installments) context.addIssue({ code: "custom", path: ["installments"], message: "Choose the number of installments" });
});
export type PaymentFormData = z.infer<typeof paymentSchema>;
