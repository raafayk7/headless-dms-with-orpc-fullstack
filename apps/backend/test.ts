import {
  dtoStandardSchema,
  simpleSchemaDto,
} from "@application/utils/validation.utils"
import { Schema as S } from "effect"
import { z } from "zod/v4"

const zodSchema = z.object({ foo: z.string().min(1) })
const zodStandardSchema = zodSchema["~standard"]

console.debug(zodStandardSchema)

const effectSchema = S.Struct({ bar: S.String.pipe(S.minLength(1)) })
const effectStandardSchema = S.standardSchemaV1(effectSchema)["~standard"]

console.debug(effectStandardSchema)

class mySchema extends simpleSchemaDto("mySchema", effectSchema) {}

const mySchemaStandard = dtoStandardSchema(mySchema)["~standard"]

console.debug(mySchemaStandard)
