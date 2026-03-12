interface Props {
  tab: "indian" | "international"
  setTab: (v: "indian" | "international") => void
}

export const LanguageTabs = ({ tab, setTab }: Props) => {
  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
        Audio Language
      </p>

      <div className="flex gap-2">

        <button
          onClick={() => setTab("indian")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium
            ${tab === "indian"
              ? "bg-violet-600 text-white"
              : "bg-muted"
            }`}
        >
          🇮🇳 Indian
        </button>

        <button
          onClick={() => setTab("international")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium
            ${tab === "international"
              ? "bg-sky-500 text-white"
              : "bg-muted"
            }`}
        >
          🌍 International
        </button>

      </div>
    </div>
  )
}