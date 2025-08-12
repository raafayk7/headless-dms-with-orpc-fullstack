// import {
//   NewUserSchema as DomainNewUserSchema,
//   UserSchema as DomainUserSchema,
// } from "@domain/user/user.entity"
// import type { JSONSchema7 } from "json-schema"
import z from "zod/v4"

export const UserSchema = z
  .object({
    id: z.uuid(),
    name: z.string().min(1),
    email: z.email(),
    emailVerified: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date(),
    image: z.string().nullish(),
  })
  .meta({
    description: "User object representing a registered user in the system.",
    example: [
      {
        id: "c4489351-5a80-4b6e-9d70-d46c83742bac",
        name: "John Doe",
        email: "john.doe@dev.com",
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  })
export type User = z.infer<typeof UserSchema>

// export const UserSchema = DomainUserSchema.annotations({
//   jsonSchema: {
//     description: "User object representing a registered user in the system.",
//     examples: [
//       {
//         id: "c4489351-5a80-4b6e-9d70-d46c83742bac",
//         name: "John Doe",
//         email: "john.doe@dev.com",
//         emailVerified: false,
//         createdAt: Date.now(),
//         updatedAt: Date.now(),
//       },
//     ],
//   } satisfies JSONSchema7,
// })

// export const NewUserSchema = DomainNewUserSchema.annotations({
//   jsonSchema: {
//     description:
//       "Schema for creating a new user, including name, email, and password.",
//     examples: [
//       {
//         name: "John Doe",
//         email: "john.doe@test.com",
//         password: "sometestpass-don't user it in prod",
//       },
//     ],
//   } satisfies JSONSchema7,
// })

export const NewUserSchema = UserSchema.pick({
  name: true,
  email: true,
})
  .extend({
    password: z
      .string()
      .min(6, { error: "Password must be at least 6 characters long." }),
  })
  .meta({
    description:
      "Schema for creating a new user, including name, email, and password.",
    example: [
      {
        name: "John Doe",
        email: "john.doe@dev.com",
        password: "suPerSeCreT@123!",
      },
    ],
  })

// JsonSchemaRegistry.add(UserSchema, {})
// JsonSchemaRegistry.add(NewUserSchema, {})
