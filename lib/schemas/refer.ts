import { z } from "zod";

export const referSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name").max(100),
  email: z.string().trim().toLowerCase().email("Please enter a valid email").max(254),
  website: z.string().max(0).optional(), // honeypot
  /** Token from the email verification code step. */
  emailProof: z.string().max(200).optional(),
});
export type ReferInput = z.infer<typeof referSchema>;
