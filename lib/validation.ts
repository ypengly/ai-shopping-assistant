import { z } from "zod";

const email = z
  .string({ required_error: "Enter your email." })
  .trim()
  .toLowerCase()
  .email("Enter a valid email address.")
  .max(254);

export const registerSchema = z.object({
  name: z
    .string({ required_error: "Enter your name." })
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(80, "Name must be 80 characters or fewer."),
  email,
  // bcrypt only uses the first 72 bytes, so cap the length instead of silently truncating.
  password: z
    .string({ required_error: "Enter a password." })
    .min(8, "Password must be at least 8 characters.")
    .max(72, "Password must be 72 characters or fewer.")
    .regex(/[A-Za-z]/, "Password must include a letter.")
    .regex(/\d/, "Password must include a number."),
});

export const loginSchema = z.object({
  email,
  password: z.string({ required_error: "Enter your password." }).min(1, "Enter your password.").max(72),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
