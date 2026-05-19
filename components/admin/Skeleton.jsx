import { motion } from 'framer-motion';

export default function Skeleton({ className, variant = 'default' }) {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700 rounded animate-pulse';

  const variantClasses = {
    default: baseClasses,
    text: 'h-4 ' + baseClasses,
    heading: 'h-6 ' + baseClasses,
    card: 'h-32 ' + baseClasses,
    avatar: 'h-10 w-10 rounded-full ' + baseClasses,
    button: 'h-10 w-24 ' + baseClasses,
    input: 'h-10 ' + baseClasses,
    table: 'h-12 ' + baseClasses,
  };

  return (
    <motion.div
      initial={{ opacity: 0.5 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: 0.5,
        repeat: Infinity,
        repeatType: 'reverse',
      }}
      className={`${variantClasses[variant]} ${className || ''}`}
    />
  );
}

export function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="flex-1 h-10" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3">
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} className="flex-1 h-12" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2">
          <Skeleton variant="text" className="w-24" />
          <Skeleton variant="heading" className="w-16" />
        </div>
        <Skeleton variant="avatar" />
      </div>
      <Skeleton variant="text" className="w-32" />
    </div>
  );
}
