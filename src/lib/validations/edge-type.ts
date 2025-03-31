import { z } from "zod";

const valueTypeEnum = z.enum([
  "string",
  "boolean",
  "integer",
  "float",
  "list<string>",
  "list<boolean>",
  "list<integer>",
  "list<float>",
  "map",
  "duration",
  "date",
  "datetime",
  "point",
]);

export const edgeTypeSchema = z.object({
  name: z.string().min(1),
  from: z.string().min(1),
  to: z.string().min(1),
  schema: z.array(
    z.object({
      key_name: z.string().min(1),
      value_type: valueTypeEnum,
    })
  ),
});

export const edgeNameChangeSchema = z.object({
  name: z.string().min(1),
  old_name: z.string().min(1),
  from: z.string().min(1),
  to: z.string().min(1),
});

export type EdgeTypeInput = z.infer<typeof edgeTypeSchema>; 