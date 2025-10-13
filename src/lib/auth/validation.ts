import { z } from "zod";

const passwordStrength = z
  .string()
  .min(12, { message: "Hasło musi mieć co najmniej 12 znaków." })
  .refine((value) => /[A-Z]/.test(value), {
    message: "Hasło musi zawierać przynajmniej jedną wielką literę.",
  })
  .refine((value) => /[a-z]/.test(value), {
    message: "Hasło musi zawierać przynajmniej jedną małą literę.",
  })
  .refine((value) => /\d/.test(value), {
    message: "Hasło musi zawierać przynajmniej jedną cyfrę.",
  })
  .refine((value) => /[!@#$%^&*()[\]{}<>,.?/~_\-+=|\\]/.test(value), {
    message: "Hasło musi zawierać przynajmniej jeden znak specjalny.",
  });

export const loginSchema = z.object({
  email: z
    .string({ required_error: "Adres e-mail jest wymagany." })
    .min(1, { message: "Adres e-mail jest wymagany." })
    .email({ message: "Podaj poprawny adres e-mail." }),
  password: z
    .string({ required_error: "Hasło jest wymagane." })
    .min(8, { message: "Hasło musi mieć co najmniej 8 znaków." }),
  rememberMe: z.boolean().default(false),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    email: z
      .string({ required_error: "Adres e-mail jest wymagany." })
      .min(1, { message: "Adres e-mail jest wymagany." })
      .email({ message: "Podaj poprawny adres e-mail." }),
    password: passwordStrength,
    confirmPassword: z
      .string({ required_error: "Potwierdzenie hasła jest wymagane." })
      .min(1, { message: "Potwierdzenie hasła jest wymagane." }),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Hasła muszą być identyczne.",
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: "Adres e-mail jest wymagany." })
    .min(1, { message: "Adres e-mail jest wymagany." })
    .email({ message: "Podaj poprawny adres e-mail." }),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export type FieldErrors<TSchema extends z.ZodTypeAny> = Partial<Record<keyof z.infer<TSchema>, string>>;

export function extractFieldErrors<TSchema extends z.ZodTypeAny>(
  error: z.ZodError<z.infer<TSchema>>
): FieldErrors<TSchema> {
  return error.issues.reduce<FieldErrors<TSchema>>((acc, issue) => {
    const field = issue.path[0];
    if (typeof field === "string" && !acc[field as keyof FieldErrors<TSchema>]) {
      acc[field as keyof FieldErrors<TSchema>] = issue.message;
    }
    return acc;
  }, {});
}
