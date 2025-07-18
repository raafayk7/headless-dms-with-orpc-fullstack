import { simpleSchemaDto } from "@application/utils/validation.utils"
import {
  GroceryListSchema,
  GroceryListUpdateSchema,
} from "@domain/grocery-list/grocery-list.entity"
import { NewGroceryListSchema } from "@domain/grocery-list/grocery-list.schemas"
import { Schema as S } from "effect"

export class CreateGroceryListDto extends simpleSchemaDto(
  "CreateGroceryListDto",
  NewGroceryListSchema,
) {}

const UpdateGroceryListDtoSchema = S.Struct({
  params: S.Struct({
    id: GroceryListSchema.id,
  }),
  body: GroceryListUpdateSchema,
})

export class UpdateGroceryListDto extends simpleSchemaDto(
  "UpdateGroceryListDto",
  UpdateGroceryListDtoSchema,
) {}
