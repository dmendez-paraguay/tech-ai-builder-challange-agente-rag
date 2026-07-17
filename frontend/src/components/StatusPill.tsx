import { CircleAlert, CircleCheck, LoaderCircle } from "lucide-react"

import { cn } from "@/lib/utils"

interface StatusPillProps {
  state: "ready" | "waiting" | "loading" | "offline"
  label: string
}

export function StatusPill({ state, label }: StatusPillProps) {
  const Icon = state === "ready" ? CircleCheck : state === "loading" ? LoaderCircle : CircleAlert

  return (
    <span
      className={cn(
        "inline-flex min-h-8 items-center gap-2 rounded-full border px-3 text-xs font-semibold",
        state === "ready" && "border-emerald-700/20 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
        state === "waiting" && "border-amber-700/20 bg-amber-500/10 text-amber-800 dark:text-amber-300",
        state === "loading" && "border-sky-700/20 bg-sky-500/10 text-sky-800 dark:text-sky-300",
        state === "offline" && "border-red-700/20 bg-red-500/10 text-red-800 dark:text-red-300",
      )}
      role="status"
      aria-label={label}
    >
      <Icon className={cn("size-3.5", state === "loading" && "animate-spin")} aria-hidden="true" />
      <span className="hidden sm:inline">{label}</span>
    </span>
  )
}
