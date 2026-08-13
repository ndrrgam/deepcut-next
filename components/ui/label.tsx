'use client';

import { cn } from '@/lib/utils';
import {
  Label as RACLabel,
  type LabelProps,
} from 'react-aria-components';

export function Label(props: LabelProps) {
  return (
    <RACLabel
      {...props}
      className={cn(
        'mb-2 block text-[0.7rem] uppercase tracking-[0.18em] text-muted',
        props.className,
      )}
    />
  );
}
