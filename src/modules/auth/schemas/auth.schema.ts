import { z } from 'zod';

export const AuthCredentialsSchema = z.object({
  email: z.email({ message: 'Email must be valid' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters long' }),
});

export type AuthCredentialsDto = z.infer<typeof AuthCredentialsSchema>;
