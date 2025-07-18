import type { FormApi } from "@tanstack/react-form"
import { isInputValidationErr } from "../errors"

export const setOnSubmitErrorMap = <
  // biome-ignore lint/suspicious/noExplicitAny: For type inference
  T extends FormApi<any, any, any, any, any, any, any, any, any, any>,
>(
  err: unknown,
  formApi: T,
) => {
  if (isInputValidationErr(err)) {
    console.debug("is validation error")
    console.debug("error data", err.data)
    formApi.setErrorMap({
      onSubmit: {
        form: err.data.formErrors.join("\n"),
        fields: err.data.fieldErrors,
      },
    })
  }
}
