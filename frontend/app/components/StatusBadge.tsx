import { ApplicationStatus, statusLabels, statusColors } from '~/lib/types';
import clsx from 'clsx';

interface StatusBadgeProps {
  status: ApplicationStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={clsx(statusColors[status])}>
      {statusLabels[status]}
    </span>
  );
}
