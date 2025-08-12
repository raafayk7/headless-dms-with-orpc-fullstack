import { type } from "arktype"

export const loginFormSchema = type({
  email: "string.email",
  password: "string",
})

export const registerFormSchema = type({
  name: "string >= 1",
  email: "string.email",
  password: "string >= 6",
})
