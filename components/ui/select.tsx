'use client';

import { cn } from '@/lib/utils';
import {
  Button as ButtonPrimitive,
  composeRenderProps,
  ListBox as ListBoxPrimitive,
  ListBoxItem as ListBoxItemPrimitive,
  ListBoxSection as ListBoxSectionPrimitive,
  Popover as PopoverPrimitive,
  Select as SelectPrimitive,
  SelectValue as SelectValuePrimitive,
  type ListBoxItemProps,
  type ListBoxProps,
  type ListBoxSectionProps,
  type SelectProps,
  type SelectValueProps,
} from 'react-aria-components';

/* ================================================================
   Select (react-aria-components) bergaya DEEP CUT.
   Digunakan juga oleh Calendar untuk dropdown bulan/tahun.
   ================================================================ */

function Chevron() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 shrink-0 text-muted transition-transform duration-200 group-data-[open=true]:rotate-180 group-data-[open=true]:text-accent"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 shrink-0 text-accent"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function Select<T extends object>({
  className,
  ...props
}: SelectProps<T>) {
  return (
    <SelectPrimitive
      data-slot="select"
      {...props}
      className={cn(
        'group relative flex w-fit flex-col gap-1 outline-none',
        className,
      )}
    />
  );
}

export function SelectGroup<T extends object>({
  className,
  ...props
}: ListBoxSectionProps<T>) {
  return (
    <ListBoxSectionPrimitive
      data-slot="select-group"
      {...props}
      className={cn('flex flex-col', className)}
    />
  );
}

export function SelectValue<T extends object>({
  className,
  ...props
}: SelectValueProps<T>) {
  return (
    <SelectValuePrimitive
      data-slot="select-value"
      {...props}
      className={cn('truncate', className)}
    />
  );
}

export function SelectTrigger({
  className,
  children,
  ...props
}: Omit<React.ComponentProps<typeof ButtonPrimitive>, 'children'> & {
  children?: React.ReactNode;
}) {
  return (
    <ButtonPrimitive
      data-slot="select-trigger"
      {...props}
      className={cn(
        'flex w-full items-center justify-between gap-3 whitespace-nowrap rounded-lg border border-line bg-surface-tertiary px-3.5 py-2.5 text-left text-sm text-ink outline-none transition-colors',
        'hover:border-accent/50',
        'focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30',
        'disabled:pointer-events-none disabled:opacity-60',
        'pressed:bg-surface-secondary',
        className,
      )}
    >
      {children}
      <Chevron />
    </ButtonPrimitive>
  );
}

export function SelectList<T extends object>({
  className,
  ...props
}: ListBoxProps<T>) {
  return (
    <ListBoxPrimitive
      data-slot="select-list"
      {...props}
      className={cn(
        'max-h-64 overflow-y-auto rounded-lg border border-line bg-surface-secondary py-1 shadow-2xl shadow-black/60 outline-none',
        className,
      )}
    />
  );
}

export function SelectPopover({
  className,
  children,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive>) {
  return (
    <PopoverPrimitive
      data-slot="select-content"
      offset={4}
      {...props}
      className={cn('min-w-(--trigger-width)', className)}
    >
      {children}
    </PopoverPrimitive>
  );
}

export function SelectContent({
  className,
  children,
  ...props
}: Omit<React.ComponentProps<typeof PopoverPrimitive>, 'children'> & {
  children?: React.ReactNode;
}) {
  return (
    <SelectPopover {...props} className={className}>
      <SelectList>{children}</SelectList>
    </SelectPopover>
  );
}

export function SelectItem({
  className,
  children,
  ...props
}: ListBoxItemProps) {
  return (
    <ListBoxItemPrimitive
      data-slot="select-item"
      textValue={
        typeof children === 'string' ? children : props.textValue
      }
      {...props}
      className={cn(
        'flex w-full cursor-default items-center justify-between gap-3 px-3.5 py-2 text-left text-sm text-body outline-none transition-colors',
        'hover:bg-surface-tertiary hover:text-ink',
        'selected:bg-accent/15 selected:text-accent',
        'focus-visible:bg-surface-tertiary focus-visible:text-ink',
        'disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
    >
      {composeRenderProps(children, (children, { isSelected }) => (
        <>
          <span className="shrink-0 whitespace-nowrap">{children}</span>
          <span className="ml-auto">{isSelected ? <CheckIcon /> : null}</span>
        </>
      ))}
    </ListBoxItemPrimitive>
  );
}
