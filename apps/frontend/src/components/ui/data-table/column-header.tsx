import { css } from "@shadow-panda/styled-system/css"
import { Flex } from "@shadow-panda/styled-system/jsx"
import { icon } from "@shadow-panda/styled-system/recipes"
import type { Column } from "@tanstack/react-table"
import { Button } from "@ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@ui/dropdown-menu"
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  EyeOffIcon,
} from "lucide-react"

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>
  title: string
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={className}>{title}</div>
  }

  return (
    <Flex align="center" gap="2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className={css({
              ml: "-3",
              h: "8",
              '&[data-state="open]': {
                bg: "accent",
              },
            })}
            size="sm"
            variant="ghost">
            <span>{title}</span>
            {column.getIsSorted() === "desc" ? (
              <ArrowDownIcon className={icon({ left: "sm" })} />
            ) : column.getIsSorted() === "asc" ? (
              <ArrowUpIcon className={icon({ left: "sm" })} />
            ) : (
              <ArrowUpDownIcon className={icon({ left: "sm" })} />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
            <ArrowUpIcon
              className={css({
                mr: "2",
                h: "3.5",
                w: "3.5",
                ca: "muted.foreground/70",
              })}
            />
            Asc
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
            <ArrowDownIcon
              className={css({
                mr: "2",
                h: "3.5",
                w: "3.5",
                ca: "muted.foreground/70",
              })}
            />
            Desc
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
            <EyeOffIcon
              className={css({
                mr: "2",
                h: "3.5",
                w: "3.5",
                ca: "muted.foreground/70",
              })}
            />
            Hide
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Flex>
  )
}
