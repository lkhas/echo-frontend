import { Loader2 } from "lucide-react"

interface Props {
  percent: number
  detail: string
}

export const ProgressSection = ({ percent, detail }: Props) => {
  return (
    <div className="bg-muted rounded-xl p-4">

      <div className="flex items-center gap-2 text-sm">
        <Loader2 className="animate-spin w-4 h-4" />
        {detail || "Processing audio..."}
      </div>

      <div className="mt-3 w-full bg-border h-2 rounded-full overflow-hidden">
        <div
          className="bg-violet-600 h-full transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className="text-xs text-muted-foreground mt-2">
        {percent}%
      </p>

    </div>
  )
}