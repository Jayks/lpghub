import { z } from "zod";

export const createCustomerSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  contactPerson: z.string().min(1, "Contact person is required"),
  phone: z
    .string()
    .regex(/^\d{10}$/, "Enter a valid 10-digit mobile number"),
  address: z.string().min(5, "Enter a complete address"),
  eligibilityLimit: z.coerce.number().int().min(1).max(50).default(5),
  // Caution deposit
  depositAmount: z.coerce.number().positive("Enter a valid deposit amount"),
  depositPaidOn: z.string().min(1, "Select a date"),
  depositPaymentMode: z.enum(["cash", "upi", "bank_transfer", "cheque"]),
  depositReferenceNo: z.string().optional(),
  depositNotes: z.string().optional(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;

// Phone is the OTP login identity — it cannot be changed here.
export const updateCustomerSchema = z.object({
  businessName:     z.string().min(1, "Business name is required"),
  contactPerson:    z.string().min(1, "Contact person is required"),
  address:          z.string().min(5, "Enter a complete address"),
  eligibilityLimit: z.coerce.number().int().min(1).max(50),
});

export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
