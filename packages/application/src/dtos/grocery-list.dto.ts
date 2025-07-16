import { validateWithEffect } from "@application/utils/validation.utils"
import type { Result } from "@carbonteq/fp"
import {
  type NewGroceryListData,
  NewGroceryListSchema,
} from "@domain/grocery-list/grocery-list.schemas"
import type { ValidationError } from "@domain/utils/base.errors"

export class CreateGroceryListDto {
  private constructor(readonly data: NewGroceryListData) {}

  static create(data: unknown): Result<CreateGroceryListDto, ValidationError> {
    return validateWithEffect(NewGroceryListSchema, data).map(
      (validatedData) => new CreateGroceryListDto(validatedData),
    )
  }
}
