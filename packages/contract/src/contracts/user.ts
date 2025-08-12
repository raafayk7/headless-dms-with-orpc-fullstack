import { appAuthenticatedBase } from "@contract/utils/oc.base"
import type { UserEncoded } from "@domain/user/user.entity"
import { type } from "@orpc/contract"

const userBase = appAuthenticatedBase

export const whoami = userBase
  .route({
    method: "GET",
    path: "/user/whoami",
    summary: "Get current user",
    tags: ["user"],
  })
  .input(type<void>())
  .output(type<UserEncoded>())

export default { whoami }
