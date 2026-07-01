export default function Loading() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <div className="inline-block w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin mb-3" />
        <p className="text-white/70 text-sm font-medium">Loading...</p>
      </div>
    </div>
  );
}
