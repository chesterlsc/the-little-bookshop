export default function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-label="Loading">
      <div className="text-center">
        <span className="mx-auto block h-9 w-9 animate-spin rounded-full border-[3px] border-taupe-300 border-t-sage-600" aria-hidden />
        <p className="mt-3 font-display font-semibold text-ink-600">Fetching tiny things…</p>
      </div>
    </div>
  );
}
