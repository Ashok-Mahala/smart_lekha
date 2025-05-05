import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"
import PropTypes from 'prop-types'

const Toaster = ({ ...props }) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme}
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

Toaster.propTypes = {
  theme: PropTypes.oneOf(["light", "dark", "system"]),
  position: PropTypes.oneOf(["top-left", "top-right", "bottom-left", "bottom-right", "top-center", "bottom-center"]),
  richColors: PropTypes.bool,
  expand: PropTypes.bool,
  duration: PropTypes.number,
  visibleToasts: PropTypes.number,
  closeButton: PropTypes.bool,
  className: PropTypes.string,
  toastOptions: PropTypes.object,
  offset: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  dir: PropTypes.oneOf(["auto", "ltr", "rtl"]),
  theme: PropTypes.oneOf(["light", "dark", "system"]),
  gap: PropTypes.number,
  loadingIcon: PropTypes.node,
  containerAriaLabel: PropTypes.string
}

export { Toaster }
