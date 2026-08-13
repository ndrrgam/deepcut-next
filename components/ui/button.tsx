'use client';

import { cn } from '@/lib/utils';
import {
  Button as RACButton,
  type ButtonProps,
} from 'react-aria-components';

export function Button(props: ButtonProps) {
  return (
    <RACButton
      {...props}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-surface-tertiary px-3.5 py-2 text-sm text-ink outline-none transition-colors',
        'hover:border-accent/50 hover:text-ink',
        'focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30',
        'disabled:pointer-events-none disabled:opacity-60',
        'pressed:bg-surface-secondary',
        props.className,
      )}
    />
  );
}
