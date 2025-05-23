import { z } from "zod";

export const formSchema = z.object({
    cardNumber: z
      .string()
      .min(16, "Card number must be at least 16 digits")
      .max(19, "Card number must be at most 19 digits")
      .regex(/^[0-9\s-]+$/, "Card number must contain only digits, spaces, or hyphens"),
    cardholderName: z.string().min(3, "Cardholder name is required"),
    expiryMonth: z.string().min(1, "Month is required"),
    expiryYear: z.string().min(1, "Year is required"),
    cvv: z
      .string()
      .min(3, "CVV must be at least 3 digits")
      .max(4, "CVV must be at most 4 digits")
      .regex(/^[0-9]+$/, "CVV must contain only digits"),
    amount: z.string().min(1, "Amount is required"),
  })