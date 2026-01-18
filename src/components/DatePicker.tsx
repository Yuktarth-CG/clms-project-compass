import * as React from 'react';
import { format, parse, isValid } from 'date-fns';
import { CalendarIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useDateFormat } from '@/contexts/DateFormatContext';

interface DatePickerProps {
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
}

export const DatePicker = ({ value, onChange, placeholder = 'Pick a date' }: DatePickerProps) => {
  const { dateFormat, getDateFnsFormat } = useDateFormat();
  const [open, setOpen] = React.useState(false);
  
  // Convert string date (YYYY-MM-DD) to Date object
  const selectedDate = React.useMemo(() => {
    if (!value) return undefined;
    const date = new Date(value + 'T00:00:00');
    return isValid(date) ? date : undefined;
  }, [value]);

  // Format the display value based on user preference
  const displayValue = React.useMemo(() => {
    if (!selectedDate) return '';
    return format(selectedDate, getDateFnsFormat());
  }, [selectedDate, getDateFnsFormat]);

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      // Format to YYYY-MM-DD for storage (ISO format)
      const isoDate = format(date, 'yyyy-MM-dd');
      onChange(isoDate);
    } else {
      onChange(null);
    }
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal h-10',
            !value && 'text-muted-foreground'
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
          <span className="flex-1 truncate">
            {displayValue || placeholder}
          </span>
          {value && (
            <X
              className="h-4 w-4 opacity-50 hover:opacity-100 flex-shrink-0"
              onClick={handleClear}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          defaultMonth={selectedDate}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
};
