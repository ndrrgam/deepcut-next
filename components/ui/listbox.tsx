'use client';

import { cn } from '@/lib/utils';
import {
  ListBox as RACListBox,
  ListBoxItem as RACListBoxItem,
  type ListBoxProps,
  type ListBoxItemProps,
} from 'react-aria-components';

export function ListBox<T extends object>(props: ListBoxProps<T>) {
  return (
    <RACListBox
      {...props}
      className={cn(
        'max-h-64 overflow-y-auto rounded-lg border border-line bg-surface-secondary py-1 shadow-2xl shadow-black/60 outline-none',
        props.className,
      )}
    />
  );
}

export function ListBoxItem<T extends object>(props: ListBoxItemProps<T>) {
  return (
    <RACListBoxItem
      {...props}
      className={cn(
        'flex w-full cursor-default items-center justify-between gap-2 px-3.5 py-2 text-left text-sm text-body outline-none transition-colors',
        'hover:bg-surface-tertiary hover:text-ink',
        'selected:bg-accent/15 selected:text-accent',
        'focus-visible:bg-surface-tertiary focus-visible:text-ink',
        props.className,
      )}
    />
  );
}
