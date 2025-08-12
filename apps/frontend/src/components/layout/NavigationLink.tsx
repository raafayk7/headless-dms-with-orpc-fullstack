import type { Omitt, Prettify } from "@app/types"
import {
  Anchor,
  type ElementProps,
  NavLink,
  type NavLinkProps,
} from "@mantine/core"
import { createLink } from "@tanstack/react-router"
import { forwardRef } from "react"

// Need this for the polymorphic component prop types to work correctly
interface AllAnchorProps
  extends NavLinkProps,
    ElementProps<"a", keyof NavLinkProps> {}

// https://tanstack.com/router/latest/docs/framework/react/guide/custom-link#mantine-example
type MantineAnchorProps = Omitt<AllAnchorProps, "href">

type AnchorLinkProps = Prettify<
  MantineAnchorProps & {
    noHover?: boolean
  }
>

const NavLinkBuilder = forwardRef<HTMLAnchorElement, AnchorLinkProps>(
  (props, ref) => {
    if (props.disabled) {
      return <NavLink ref={ref} {...props} style={{ opacity: 0.5 }} />
    }

    return (
      <NavLink
        ref={ref}
        {...props}
        component={Anchor}
        styles={{
          root: { textDecoration: "none" },
          label: { textDecoration: "none" },
        }}
      />
    )
  },
)

const NavigationLink = createLink(NavLinkBuilder)

export default NavigationLink
