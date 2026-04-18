import { z } from "zod";
import { ValidationError } from "../errors.js";

// Loose email check. Strict RFC parsing is both overkill and wrong — we only
// care that the client typed something roughly shaped like an email.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const signupSchema = z.object({
  email: z
    .string({ required_error: "Email is required." })
    .trim()
    .toLowerCase()
    .max(254, "Email is too long.")
    .refine((v) => EMAIL_RE.test(v), { message: "Enter a valid email address." }),
  password: z
    .string({ required_error: "Password is required." })
    .min(8, "Password must be at least 8 characters.")
    .max(128, "Password is too long."),
});

export const loginSchema = signupSchema;

/**
 * @param {unknown} body
 */
export function parseSignup(body) {
  const r = signupSchema.safeParse(body);
  if (!r.success) throw new ValidationError(r.error.errors[0]?.message || "Invalid signup.");
  return r.data;
}

/**
 * @param {unknown} body
 */
export function parseLogin(body) {
  const r = loginSchema.safeParse(body);
  if (!r.success) throw new ValidationError(r.error.errors[0]?.message || "Invalid login.");
  return r.data;
}
