import { useFieldContext } from "@app/shared/contexts/form-context"
import { TextInput, type TextInputProps } from "@mantine/core"

export interface TextFieldProps extends TextInputProps {}

const TextField = ({
  radius = "md",
  labelProps = {},
  ...rest
}: TextFieldProps) => {
  const field = useFieldContext<string>()
  const isInvalid = !field.state.meta.isValid
  const errMsg = field.state.meta.errors.join(", ")

  return (
    <TextInput
      aria-errormessage={errMsg}
      aria-invalid={isInvalid}
      error={errMsg}
      labelProps={{ mb: "xs", ...labelProps }}
      name={field.name}
      onBlur={field.handleBlur}
      onChange={(e) => field.handleChange(e.target.value)}
      radius={radius}
      value={field.state.value}
      withErrorStyles={true}
      {...rest}
    />
  )
}

export default TextField
