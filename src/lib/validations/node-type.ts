import { z } from "zod";
import color from "color-string";

export function colorValidator(val: string) {
  try {
    return color.get(val) != null;
  } catch {
    return false;
  }
}

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

export const nodeTypeSchema = z.object({
  name: z.string().min(1),
  color: z.string().refine(colorValidator, { message: "Invalid color" }),
  schema: z.array(
    z.object({
      key_name: z.string().min(1),
      value_type: valueTypeEnum,
    })
  ),
});

export const nodeNameChangeSchema = z.object({
  name: z.string().min(1),
  old_name: z.string().min(1),
});

export const nodePositionChangeSchema = z.object({
  name: z.string().min(1),
  x_pos: z.number(),
  y_pos: z.number(),
});

export type NodeTypeInput = z.infer<typeof nodeTypeSchema>; 