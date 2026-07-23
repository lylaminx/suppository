import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string(),
  NODE_ENV: z.enum([
    "development",
    "test",
    "production",
  ]),
});

export const env = schema.parse(process.env);
