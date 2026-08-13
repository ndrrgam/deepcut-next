'use client';

import { cn } from '@/lib/utils';
import {
  Calendar as AriaCalendar,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader as AriaCalendarGridHeader,
  CalendarHeaderCell,
  CalendarHeading,
  CalendarMonthPicker,
  CalendarYearPicker,
  type CalendarProps,
  type DateValue,
} from 'react-aria-components';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/* ================================================================
   Calendar (react-aria-components) bergaya DEEP CUT.
   Mendukung captionLayout="dropdown" (pilih bulan/tahun via Select)
   atau "label" (teks bulan/tahun).
   ================================================================ */

function ChevronLeft() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export interface DCCalendarProps<T extends DateValue>
  extends Omit<CalendarProps<T>, 'visibleDuration'> {
  /** "dropdown" menampilkan pilih bulan/tahun, "label" teks statis. */
  captionLayout?: 'dropdown' | 'label';
  /** Format heading (bulan/tahun) untuk mode label. */
  headerFormat?: Intl.DateTimeFormatOptions;
}

export function DCCalendar<T extends DateValue>({
  className,
  captionLayout = 'dropdown',
  headerFormat,
  ...props
}: DCCalendarProps<T>) {
  return (
    <AriaCalendar
      {...props}
      visibleDuration={{ months: 1 }}
      className={cn(
        'w-fit rounded-lg border border-line bg-surface-secondary p-3 text-ink',
        className,
      )}
    >
      <CalendarInner
        captionLayout={captionLayout}
        headerFormat={headerFormat}
      />
    </AriaCalendar>
  );
}

function CalendarInner({
  captionLayout = 'label',
  headerFormat,
}: {
  captionLayout?: 'dropdown' | 'label';
  headerFormat?: Intl.DateTimeFormatOptions;
}) {
  return (
    <div className="relative flex flex-col">
      <header className="flex w-full items-center justify-between gap-2 pb-3">
        <button
          type="button"
          slot="previous"
          className="grid size-8 place-items-center rounded-md border border-line bg-surface-tertiary text-muted outline-none transition-colors hover:border-accent/50 hover:text-ink focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30 disabled:pointer-events-none disabled:opacity-40"
        >
          <ChevronLeft />
        </button>

        <div className="flex flex-1 items-center justify-center gap-1">
          {captionLayout === 'dropdown' ? (
            <>
              <MonthDropdown format={headerFormat} />
              <YearDropdown format={headerFormat} />
            </>
          ) : (
            <CalendarHeading
              offset={{ months: 0 }}
              format={headerFormat}
              className="font-display text-base font-bold uppercase italic tracking-wide"
            />
          )}
        </div>

        <button
          type="button"
          slot="next"
          className="grid size-8 place-items-center rounded-md border border-line bg-surface-tertiary text-muted outline-none transition-colors hover:border-accent/50 hover:text-ink focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30 disabled:pointer-events-none disabled:opacity-40"
        >
          <ChevronRight />
        </button>
      </header>

      <CalendarGrid weekdayStyle="short" className="w-full border-collapse">
        <AriaCalendarGridHeader>
          {(day) => (
            <CalendarHeaderCell className="pb-2 text-center text-[0.65rem] font-semibold uppercase tracking-widest text-muted">
              {day}
            </CalendarHeaderCell>
          )}
        </AriaCalendarGridHeader>
        <CalendarGridBody className="[&>tr>td]:p-0">
          {(date) => (
            <CalendarCell
              date={date}
              className={cn(
                'group relative size-9 rounded-md text-center text-sm text-body outline-none transition-colors',
                'hover:bg-surface-tertiary hover:text-ink',
                'focus-visible:ring-2 focus-visible:ring-accent/40',
                'outside-month:text-muted/40',
                'selected:bg-accent selected:font-semibold selected:text-white',
                'disabled:pointer-events-none disabled:text-muted/30',
              )}
            >
              {({ formattedDate, isSelected, isToday }) => (
                <span
                  className={cn(
                    'grid size-9 place-items-center rounded-md',
                    isToday &&
                      !isSelected &&
                      'border border-accent/60 text-accent',
                  )}
                >
                  {formattedDate}
                </span>
              )}
            </CalendarCell>
          )}
        </CalendarGridBody>
      </CalendarGrid>
    </div>
  );
}

function MonthDropdown({ format }: { format?: Intl.DateTimeFormatOptions }) {
  return (
    <CalendarMonthPicker format={format?.month}>
      {(props) => (
        <Select {...props} className="relative">
          <SelectTrigger className="min-w-0 px-2 py-1 text-xs font-semibold uppercase tracking-wide">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="min-w-0">
            <SelectGroup>
              {props.items.map((item) => (
                <SelectItem key={item.id} id={item.id}>
                  {item.formatted}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      )}
    </CalendarMonthPicker>
  );
}

function YearDropdown({ format }: { format?: Intl.DateTimeFormatOptions }) {
  return (
    <CalendarYearPicker format={format}>
      {(props) => (
        <Select {...props} className="relative">
          <SelectTrigger className="min-w-0 px-2 py-1 text-xs font-semibold uppercase tracking-wide">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="min-w-0">
            {props.items.map((item) => (
              <SelectItem key={item.id} id={item.id}>
                {item.formatted}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </CalendarYearPicker>
  );
}
