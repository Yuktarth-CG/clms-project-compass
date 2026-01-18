import React, { createContext, useContext, useState, useEffect } from 'react';

export type DateFormatOption = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';

interface DateFormatContextType {
  dateFormat: DateFormatOption;
  setDateFormat: (format: DateFormatOption) => void;
  formatDateString: (dateStr: string | null) => string;
  formatDate: (dateStr: string | null) => string;
  getDateFnsFormat: () => string;
}

const DateFormatContext = createContext<DateFormatContextType | undefined>(undefined);

const DATE_FORMAT_KEY = 'app_date_format';

const formatMap: Record<DateFormatOption, string> = {
  'DD/MM/YYYY': 'dd/MM/yyyy',
  'MM/DD/YYYY': 'MM/dd/yyyy',
  'YYYY-MM-DD': 'yyyy-MM-dd',
};

export const DateFormatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dateFormat, setDateFormatState] = useState<DateFormatOption>(() => {
    const stored = localStorage.getItem(DATE_FORMAT_KEY);
    return (stored as DateFormatOption) || 'DD/MM/YYYY';
  });

  const setDateFormat = (format: DateFormatOption) => {
    setDateFormatState(format);
    localStorage.setItem(DATE_FORMAT_KEY, format);
  };

  const getDateFnsFormat = () => formatMap[dateFormat];

  const formatDateString = (dateStr: string | null): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    switch (dateFormat) {
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`;
      case 'MM/DD/YYYY':
        return `${month}/${day}/${year}`;
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      default:
        return `${day}/${month}/${year}`;
    }
  };

  return (
    <DateFormatContext.Provider value={{ dateFormat, setDateFormat, formatDateString, formatDate: formatDateString, getDateFnsFormat }}>
      {children}
    </DateFormatContext.Provider>
  );
};

export const useDateFormat = () => {
  const context = useContext(DateFormatContext);
  if (!context) {
    throw new Error('useDateFormat must be used within a DateFormatProvider');
  }
  return context;
};
