import { BaseEntity, defineEntityStruct } from "@domain/utils/base.entity"
import { Opt } from "@domain/utils/refined-types"
import { createEncoderDecoderBridge } from "@domain/utils/schema-utils"
import { Schema as S } from "effect"

export const UserSchema = defineEntityStruct("UserId", {
  name: S.String.pipe(S.minLength(1)),
  email: S.String.pipe(S.minLength(1), S.brand("Email")),
  emailVerified: S.Boolean,
  image: Opt(S.String),
})
export const UserIdSchema = UserSchema.id

export type UserType = S.Schema.Type<typeof UserSchema>
export type UserEncoded = S.Schema.Encoded<typeof UserSchema>

export const NewUserSchema = UserSchema.pipe(
  S.pick("email", "name"),
  S.extend(
    S.Struct({
      password: S.String.pipe(S.minLength(6)),
    }),
  ),
)
export type NewUserType = S.Schema.Type<typeof NewUserSchema>
export type NewUserEncoded = S.Schema.Encoded<typeof NewUserSchema>

const bridge = createEncoderDecoderBridge(UserSchema)

export class UserEntity extends BaseEntity implements UserType {
  override readonly id: UserType["id"]

  readonly name: string
  readonly email: UserType["email"]
  readonly emailVerified: boolean
  readonly image: UserType["image"]

  private constructor(data: UserType) {
    super(data)
    this.id = data.id
    this.name = data.name
    this.email = data.email
    this.emailVerified = data.emailVerified
    this.image = data.image
  }

  static from(data: UserType): UserEntity {
    return new UserEntity(data)
  }

  static fromEncoded(data: UserEncoded) {
    return bridge.deserialize(data).map((userData) => new UserEntity(userData))
  }

  serialize() {
    return bridge.serialize(this)
  }
}
