import * as React from "react"
import { ChevronRight, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"

function Breadcrumb({ children, className, separator = <ChevronRight className="h-4 w-4" />, ...props }) {
  return (
    <nav
      aria-label="breadcrumb"
      className={cn("flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground", className)}
      {...props}
    >
      {children}
    </nav>
  )
}

function BreadcrumbList({ children, className, ...props }) {
  return (
    <ol className={cn("flex flex-wrap items-center gap-1.5", className)} {...props}>
      {children}
    </ol>
  )
}

function BreadcrumbItem({ children, className, ...props }) {
  return (
    <li className={cn("inline-flex items-center gap-1.5", className)} {...props}>
      {children}
    </li>
  )
}

function BreadcrumbLink({ asChild, className, ...props }) {
  const Comp = asChild ? React.Fragment : "a"
  return (
    <Comp
      className={cn("transition-colors hover:text-foreground", className)}
      {...props}
    />
  )
}

function BreadcrumbPage({ className, ...props }) {
  return <span className={cn("font-normal text-foreground", className)} {...props} />
}

function BreadcrumbSeparator({ children = <ChevronRight className="h-4 w-4" />, className, ...props }) {
  return (
    <li role="presentation" aria-hidden="true" className={cn("[&>svg]:size-3.5", className)} {...props}>
      {children}
    </li>
  )
}

function BreadcrumbEllipsis({ className, ...props }) {
  return (
    <li role="presentation" className={cn("[&>svg]:size-3.5", className)} {...props}>
      <MoreHorizontal className="h-4 w-4" />
      <span className="sr-only">More</span>
    </li>
  )
}

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
}
