const steps = [
  { label: 'Job Posted', icon: '📋', key: 'Open' },
  { label: 'Worker Assigned', icon: '👷', key: 'Assigned' },
  { label: 'In-Progress', icon: '🔧', key: 'In-Progress' },
  { label: 'Completed', icon: '✅', key: 'Completed' },
  { label: 'Rated', icon: '⭐', key: 'Rated' },
];

const statusOrder = ['Open', 'Assigned', 'In-Progress', 'Completed', 'Rated'];

const JobTimeline = ({ currentStatus }) => {
  const currentIndex = statusOrder.indexOf(currentStatus);
  return (
    <div className="flex flex-col gap-4">
      {steps.map((step, i) => {
        const isDone = i < currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <div key={step.key} className="flex items-center gap-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
              isDone ? 'bg-green-500 text-white' :
              isCurrent ? 'bg-indigo-600 text-white animate-pulse' :
              'bg-gray-200 dark:bg-slate-700 text-gray-400'
            }`}>
              {isDone ? '✓' : step.icon}
            </div>
            <div>
              <p className={`text-sm font-semibold ${isDone || isCurrent ? 'text-gray-800 dark:text-white' : 'text-gray-400 dark:text-slate-500'}`}>
                {step.label}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
export default JobTimeline;
