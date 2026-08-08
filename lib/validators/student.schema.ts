import { z } from "zod";

export const schoolClasses = ["Primary 3", "Primary 4", "Primary 5", "Primary 6", "Basic 5", "Basic 6", "JSS1", "JSS2", "JSS3", "SSS1", "SSS2", "SSS3"] as const;
const phone = z.string().regex(/^\+?[0-9]{10,15}$/, "Enter a valid phone number");

/** Full student record validation for registration and API boundaries. */
export const studentSchema = z.object({
  firstName: z.string().trim().min(2, "First name must be at least 2 characters").max(50),
  lastName: z.string().trim().min(2, "Last name must be at least 2 characters").max(50),
  email: z.string().email("Enter a valid email address"),
  phone: phone,
  admissionNumber: z.string().regex(/^EGIA-[PS]-\d{6}$/, "Use EGIA-P-###### or EGIA-S-######"),
  class: z.enum(schoolClasses),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date"),
  gender: z.enum(["MALE", "FEMALE"]),
  address: z.string().trim().max(250).optional(),
  parentName: z.string().trim().min(2, "Parent name is required").max(100),
  parentPhone: phone,
});

/** The data the admin enrollment screen actually collects. */
export const studentEnrollmentSchema = z.object({
  firstName: z.string().trim().min(2, "First name must be at least 2 characters").max(50),
  lastName: z.string().trim().min(2, "Last name must be at least 2 characters").max(50),
  email: z.union([z.string().email("Enter a valid email address"), z.literal("")]).optional(),
  admissionNumber: z.union([z.string().regex(/^EGIA-[PS]-\d{6}$/, "Use EGIA-P-###### or EGIA-S-######"), z.literal("")]).optional(),
  class: z.enum(schoolClasses, { message: "Select a class" }),
  gender: z.enum(["MALE", "FEMALE"]),
  academicSession: z.string().min(1),
  term: z.enum(["First Term", "Second Term", "Third Term"]),
});

export type StudentFormData = z.infer<typeof studentSchema>;
export type StudentEnrollmentData = z.infer<typeof studentEnrollmentSchema>;
