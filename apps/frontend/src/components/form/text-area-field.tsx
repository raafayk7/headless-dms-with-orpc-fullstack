import { useFieldContext } from "@app/shared/contexts/form-context"
import { Textarea, type TextareaProps } from "@mantine/core"

export interface TextAreaFieldProps extends TextareaProps {}

const TextAreaField = ({
  radius = "md",
  labelProps = {},
  ...rest
}: TextAreaFieldProps) => {
  const field = useFieldContext<string>()
  const isInvalid = !field.state.meta.isValid
  const errMsg = field.state.meta.errors.join(", ")

  return (
    <Textarea
      aria-errormessage={errMsg}
      aria-invalid={isInvalid}
      error={errMsg}
      labelProps={{ mb: "xs", ...labelProps }}
      name={field.name}
      onBlur={field.handleBlur}
      onChange={(e) => field.handleChange(e.target.value)}
      radius={radius}
      value={field.state.value}
      {...rest}
    />
  )
}

export default TextAreaField
