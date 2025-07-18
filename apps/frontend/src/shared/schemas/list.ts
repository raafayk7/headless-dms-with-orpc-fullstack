import { type } from "arktype"

export const newGroceryListFormSchema = type({
  name: "string>=1",
  description: "string",
  items: type({}).array(),
})
export type NewGroceryListFormData = typeof newGroceryListFormSchema.infer
