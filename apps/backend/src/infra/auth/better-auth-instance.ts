// biome-ignore assist/source/organizeImports: Need reflect-metadata at top for DI
import "reflect-metadata"
import { resolveAuthFromContainer } from "./better-auth"
import { container } from "tsyringe"

export const auth = resolveAuthFromContainer(container)

export default auth
