export default function FloatingControls({
  onLocate,
  onOpenFilters,
}: {
  onLocate: () => void
  onOpenFilters: () => void
}) {
  return (
    <div className="pointer-events-none absolute right-3 bottom-3 flex flex-col gap-2">
      <button
        onClick={onLocate}
        className="pointer-events-auto btn btn-primary rounded-full w-12 h-12"
        aria-label="Locate me"
      >
        ⦿
      </button>
      <button
        onClick={onOpenFilters}
        className="pointer-events-auto btn btn-secondary rounded-full w-12 h-12"
        aria-label="Open filters"
      >
        🎛
      </button>
    </div>
  )
}
