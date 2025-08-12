import { type } from "arktype"

export const newGroceryListFormSchema = type({
  name: "string>=2",
  description: "string",
  items: type({
    name: "string>=1",
    quantity: "number.integer>0",
    notes: "string",
  }).array(),
})
export type NewGroceryListFormData = typeof newGroceryListFormSchema.infer
