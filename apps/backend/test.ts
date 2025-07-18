import {
  dtoStandardSchema,
  simpleSchemaDto,
} from "@application/utils/validation.utils"
import { Schema as S, Effect as E, Either } from "effect"
import { z } from "zod/v4"

// const zodSchema = z.object({ foo: z.string().min(1) })
// const zodStandardSchema = zodSchema["~standard"]
//
// console.debug(zodStandardSchema)

const effectSchema = S.Struct({
  bar: S.String.pipe(S.minLength(3)),
  foo: S.Boolean,
  baz: S.Number,
  bb: S.Struct({ nested: S.Date }),
})
// const effectStandardSchema = S.standardSchemaV1(effectSchema)["~standard"]
//
// console.debug(effectStandardSchema)
//
// class mySchema extends simpleSchemaDto("mySchema", effectSchema) {}
//
// const mySchemaStandard = dtoStandardSchema(mySchema)["~standard"]
//
// console.debug(mySchemaStandard)

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
    console.debug("Decoding failed")
    console.debug(err.issue)

    if (err.issue._tag === "Composite") {
      for (const iss of Array.from(err.issue.issues)) {
        console.debug("Inner issue", iss)
      }
    }
  },
})
