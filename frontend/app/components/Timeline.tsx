import { CheckCircle2, Circle, Package, ClipboardCheck, FileCheck, Truck, TestTube, ArrowLeftRight, Search, Award } from 'lucide-react';
import { ApplicationStatus } from '~/lib/types';

interface TimelineItem {
  status: ApplicationStatus;
  label: string;
  icon: React.ElementType;
  completed: boolean;
  current: boolean;
  date?: string;
}

interface TimelineProps {
  currentStatus: ApplicationStatus;
  createdAt: string;
}

const statusSequence: Array<{ status: ApplicationStatus; label: string; icon: React.ElementType }> = [
  { status: 'pending_sales_review', label: '提交申请', icon: ClipboardCheck },
  { status: 'pending_legal_review', label: '销售审核', icon: ClipboardCheck },
  { status: 'pending_shipment', label: '合规审核', icon: FileCheck },
  { status: 'shipped', label: '仓库发货', icon: Package },
  { status: 'in_testing', label: '客户签收', icon: Truck },
  { status: 'pending_return', label: '测试使用', icon: TestTube },
  { status: 'returning', label: '发起归还', icon: ArrowLeftRight },
  { status: 'inspecting', label: '客户寄回', icon: Truck },
  { status: 'completed', label: '仓库验收', icon: Search },
  { status: 'completed', label: '押金退还', icon: Award },
];

const statusOrder: ApplicationStatus[] = [
  'draft',
  'pending_sales_review',
  'pending_legal_review',
  'sales_rejected',
  'legal_rejected',
  'approved',
  'pending_shipment',
  'shipped',
  'in_testing',
  'pending_return',
  'returning',
  'inspecting',
  'completed',
  'cancelled',
];

export function Timeline({ currentStatus }: TimelineProps) {
  const currentIndex = statusOrder.indexOf(currentStatus);
  const isRejected = currentStatus === 'sales_rejected' || currentStatus === 'legal_rejected';

  const displayItems = isRejected
    ? statusSequence.slice(0, statusSequence.findIndex(s => s.status === currentStatus.replace('_rejected', '_review')) + 1)
    : statusSequence;

  const items: TimelineItem[] = displayItems.map((item, index) => {
    const itemStatusIndex = statusOrder.indexOf(item.status);
    let completed = false;
    let current = false;

    if (isRejected) {
      if (index < displayItems.length - 1) {
        completed = true;
      } else if (index === displayItems.length - 1) {
        current = true;
      }
    } else {
      completed = itemStatusIndex <= currentIndex;
      current = index === displayItems.length - 1 && itemStatusIndex === currentIndex;
    }

    return {
      ...item,
      completed,
      current,
    };
  });

  return (
    <div className="relative">
      <div className="absolute left-5 top-3 bottom-3 w-0.5 bg-slate-200" />
      
      {items.map((item, index) => (
        <div key={index} className="relative flex items-start gap-4 py-3">
          <div className={
            `relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
              item.completed
                ? 'bg-success text-white'
                : item.current
                ? 'bg-accent-500 text-white animate-pulse-soft'
                : 'bg-slate-200 text-slate-400'
            }`
          }>
            {item.completed ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <item.icon className="w-5 h-5" />
            )}
          </div>
          
          <div className="flex-1 pt-1">
            <p className={
              `font-medium ${
                item.completed ? 'text-slate-900' : item.current ? 'text-primary-500' : 'text-slate-400'
              }`
            }>
              {item.label}
              {isRejected && item.current && (
                <span className="ml-2 text-danger text-sm">已驳回</span>
              )}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
