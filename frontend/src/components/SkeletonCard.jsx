const SkeletonCard = () => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-gray-100 dark:border-slate-700 p-6 animate-pulse">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-12 h-12 bg-gray-200 dark:bg-slate-700 rounded-full" />
      <div className="flex-1">
        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4 mb-2" />
        <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/2" />
      </div>
    </div>
    <div className="space-y-2">
      <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded" />
      <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-5/6" />
      <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-4/6" />
    </div>
    <div className="flex gap-2 mt-4">
      <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded-xl flex-1" />
      <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded-xl flex-1" />
    </div>
  </div>
);
export default SkeletonCard;
