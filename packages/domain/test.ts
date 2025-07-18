import { parseErrorToValidationError } from "@domain/utils/valididation.utils"
import { Either, Schema as S } from "effect"

const effectSchema = S.Struct({
  bar: S.String, //.pipe(S.minLength(3)),
  foo: S.Boolean,
  baz: S.Number,
  bb: S.Struct({ nested: S.Date }),
})

const res = S.decodeUnknownEither(effectSchema, { errors: "all", exact: true })(
  {
    bar: "t",
    fooo: true,
    baz: "123",
    bb: {},
  },
)

Either.match(res, {
  onRight: (right) => {
    console.debug("Decoded successfully", right)
  },
  onLeft: (err) => {
    // console.debug("Decoding failed")
    // console.debug(err.issue)
    //
    // if (err.issue._tag === "Composite") {
    //   for (const iss of Array.from(err.issue.issues)) {
    //     console.debug("Inner issue", iss)
    //   }
    // }

    const parsed = parseErrorToValidationError(err)

    console.debug("Parsed issues", parsed.issues)
  },
})
