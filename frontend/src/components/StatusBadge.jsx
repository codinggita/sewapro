const StatusBadge = ({ status }) => {
  const map = {
    Open: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    Assigned: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
    'In-Progress': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    Completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    Cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    Pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    Confirmed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[status] || 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  );
};
export default StatusBadge;
