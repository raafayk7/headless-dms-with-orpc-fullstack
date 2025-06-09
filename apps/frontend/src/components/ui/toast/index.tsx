"use client"

import * as ToastPrimitive from "@radix-ui/react-toast"
import { createStyleContext } from "@shadow-panda/style-context"
import { styled } from "@shadow-panda/styled-system/jsx"
import { icon, toast, toastViewport } from "@shadow-panda/styled-system/recipes"
import { X } from "lucide-react"

const { withProvider, withContext } = createStyleContext(toast)

export const ToastProvider = ToastPrimitive.Provider
export const ToastViewport = styled(ToastPrimitive.Viewport, toastViewport)
export const Toast = withProvider(styled(ToastPrimitive.Root), "root", {
  className: "group",
})
export const ToastAction = withContext(styled(ToastPrimitive.Action), "action")
export const ToastClose = withContext(styled(ToastPrimitive.Close), "close", {
  children: <X className={icon()} />,
})
export const ToastTitle = withContext(styled(ToastPrimitive.Title), "title")
export const ToastDescription = withContext(
  styled(ToastPrimitive.Description),
  "description",
)

export type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>
export type ToastActionElement = React.ReactElement<typeof ToastAction>
