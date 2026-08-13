'use client';

import { cn } from '@/lib/utils';
import {
  Popover as RACPopover,
  type PopoverProps,
} from 'react-aria-components';

export function Popover(props: PopoverProps) {
  return (
    <RACPopover
      {...props}
      className={cn(
        'rounded-lg border border-line bg-surface-secondary shadow-2xl shadow-black/60 outline-none',
        props.className,
      )}
    />
  );
}
