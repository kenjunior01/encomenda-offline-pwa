import * as React from "react"
import { Toaster as SonnerToaster, toast } from "sonner"

// Lightweight wrapper without next-themes to avoid extra providers
// Consumers can still control theme via props if needed

type ToasterProps = React.ComponentProps<typeof SonnerToaster>

const Toaster = ({ theme = "light", ...props }: ToasterProps) => {
  return (
    <SonnerToaster
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
