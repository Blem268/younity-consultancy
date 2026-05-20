import { z } from "zod";

export const leadSchema = z.object({
  name: z.string().min(2, "Name is required."),
  email: z.string().email("A valid email is required."),
  phone: z.string().optional().default(""),
  company: z.string().optional().default(""),
  service: z.string().min(2, "Service is required."),
  message: z.string().min(5, "Message is required."),
  source: z.string().optional().default("Website Contact Form"),
});

export type LeadInput = z.infer<typeof leadSchema>;