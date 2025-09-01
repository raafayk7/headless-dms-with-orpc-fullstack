import { appPublicBase } from "@contract/utils/oc.base"
import { dtoStandardSchema } from "@application/utils/validation.utils"
import { LoginUserDto, RegisterUserDto } from "@application/dtos/user.dto"
import { LoginResponseDto, RegisterResponseDto } from "@application/dtos/auth.dto"
import { type } from "@orpc/contract"

const authBase = appPublicBase

export const login = authBase
  .route({
    method: "POST",
    path: "/auth/login",
    summary: "User login",
    tags: ["auth"],
  })
  .input(dtoStandardSchema(LoginUserDto))
  .output(dtoStandardSchema(LoginResponseDto))

export const register = authBase
  .route({
    method: "POST",
    path: "/auth/register",
    summary: "User registration",
    tags: ["auth"],
  })
  .input(dtoStandardSchema(RegisterUserDto))
  .output(dtoStandardSchema(RegisterResponseDto))

export default {
  login,
  register,
}
