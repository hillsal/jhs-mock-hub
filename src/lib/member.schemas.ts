import { z } from "zod";

export const PRODUCT_TYPES = ["mock", "prediction", "provision", "training", "other"] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  mock: "Mock Examination",
  prediction: "Prediction",
  provision: "Provision",
  training: "Training Material",
  other: "Other",
};

export const registerMemberSchema = z.object({
  organizationName: z.string().trim().min(3, "Enter the school / organization name").max(160),
  contactPerson: z.string().trim().min(3, "Enter the contact person").max(120),
  phone: z.string().trim().min(9, "Enter a valid phone number").max(20),
  whatsapp: z.string().trim().max(20).optional().or(z.literal("")),
  email: z.string().trim().email("Enter a valid email address").max(160),
  region: z.string().trim().min(2, "Select a region").max(80),
  district: z.string().trim().min(2, "Enter the district").max(120),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  schoolType: z.string().trim().max(80).optional().or(z.literal("")),
  candidates: z.coerce.number().int().min(0).max(100000),
  students: z.coerce.number().int().min(0).max(100000),
  academicYear: z.string().trim().min(4, "Enter the academic year").max(20),
});

export type RegisterMemberInput = z.input<typeof registerMemberSchema>;
export type RegisterMemberValues = z.output<typeof registerMemberSchema>;

export function parseRegisterMemberInput(input: unknown): RegisterMemberValues {
  return registerMemberSchema.parse(input);
}

export function parseProductType(value: unknown): ProductType | undefined {
  return PRODUCT_TYPES.includes(value as ProductType) ? (value as ProductType) : undefined;
}
