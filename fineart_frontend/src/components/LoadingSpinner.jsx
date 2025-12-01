export default function LoadingSpinner({ label = 'Loading...' }) {
  return (
    <div className="flex w-full items-center justify-center py-16">
      <div className="flex flex-col items-center gap-4 text-sm text-neutral-600">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        <span>{label}</span>
      </div>
    </div>
  );
}
