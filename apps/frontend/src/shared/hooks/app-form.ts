import PasswordField from "@app/components/form/password-field"
import SubmitButton from "@app/components/form/submit-btn"
import TextAreaField from "@app/components/form/text-area-field"
import TextField from "@app/components/form/text-field"
import { fieldContext, formContext } from "@app/shared/contexts/form-context"
import { createFormHook } from "@tanstack/react-form"

export const { useAppForm, withForm } = createFormHook({
  fieldComponents: {
    TextField,
    PasswordField,
    TextAreaField,
  },
  formComponents: {
    SubmitButton,
  },
  fieldContext,
  formContext,
})
