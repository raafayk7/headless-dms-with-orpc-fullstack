import { GroceryListCreateSchema } from "@domain/grocery-list/grocery-list.entity"
import { parseErrorToValidationError } from "@domain/utils/valididation.utils"
import { Either, Schema as S } from "effect"

// const effectSchema = S.Struct({
//   bar: S.String.pipe(S.minLength(3)),
//   foo: S.BooleanFromString,
//   baz: S.Number,
//   bb: S.Struct({ nested: S.Date }),
// })
const res = S.decodeUnknownEither(GroceryListCreateSchema)({
  description: "Valid description",
  // Missing required 'name' field
})

Either.match(res, {
  onRight: (right) => {
    console.debug("Decoded successfully", right)
  },
  onLeft: (err) => {
    const parsed = parseErrorToValidationError(err)

    console.debug("Parsed issues", parsed.issues)
  },
})
