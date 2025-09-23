import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Calendar, Clock } from 'lucide-react';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  showTime?: boolean;
}

const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = "DD-MM-YYYY",
  disabled = false,
  className = "",
  showTime = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || '');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState({ hours: '00', minutes: '00' });
  const containerRef = useRef<HTMLDivElement>(null);

  // Función para formatear fecha a DD-MM-YYYY
  const formatDate = useCallback((date: Date): string => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }, []);

  // Función para formatear fecha con hora a DD-MM-YYYY HH:MM
  const formatDateTime = useCallback((date: Date, time: { hours: string, minutes: string }): string => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year} ${time.hours}:${time.minutes}`;
  }, []);

  // Función para parsear fecha desde DD-MM-YYYY
  const parseDate = useCallback((dateStr: string): Date | null => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Los meses en JS van de 0-11
      const year = parseInt(parts[2], 10);
      
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return new Date(year, month, day);
      }
    }
    return null;
  }, []);

  // Función para parsear fecha con hora desde DD-MM-YYYY HH:MM
  const parseDateTime = useCallback((dateTimeStr: string): { date: Date | null, time: { hours: string, minutes: string } } => {
    const [datePart, timePart] = dateTimeStr.split(' ');
    const date = parseDate(datePart);
    let time = { hours: '00', minutes: '00' };
    
    if (timePart) {
      const [hours, minutes] = timePart.split(':');
      if (hours && minutes) {
        time = { hours, minutes };
      }
    }
    
    return { date, time };
  }, [parseDate]);

  // Inicializar valores
  useEffect(() => {
    if (value && value.trim()) {
      if (showTime) {
        const { date, time } = parseDateTime(value);
        if (date) {
          setSelectedDate(date);
          setSelectedTime(time);
          setInputValue(formatDateTime(date, time));
        }
      } else {
        const date = parseDate(value);
        if (date) {
          setSelectedDate(date);
          setInputValue(formatDate(date));
        }
      }
    } else {
      // Si no hay valor, inicializar con la fecha actual
      const now = new Date();
      setSelectedDate(now);
      if (showTime) {
        setSelectedTime({
          hours: now.getHours().toString().padStart(2, '0'),
          minutes: now.getMinutes().toString().padStart(2, '0')
        });
        setInputValue(formatDateTime(now, {
          hours: now.getHours().toString().padStart(2, '0'),
          minutes: now.getMinutes().toString().padStart(2, '0')
        }));
      } else {
        setInputValue(formatDate(now));
      }
    }
  }, [value, showTime, parseDateTime, parseDate, formatDateTime, formatDate]);

  // Sincronizar inputValue con value prop solo cuando el componente no está enfocado
  useEffect(() => {
    if (!isOpen) {
      setInputValue(value || '');
    }
  }, [value, isOpen]);

  // Manejar cambio en el input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Solo actualizar el estado interno y llamar onChange si el formato es válido
    if (showTime) {
      const { date, time } = parseDateTime(newValue);
      if (date) {
        setSelectedDate(date);
        setSelectedTime(time);
        onChange(formatDateTime(date, time));
      } else {
        // Si no es una fecha válida, solo actualizar el input pero no llamar onChange
        // Esto permite al usuario escribir libremente
      }
    } else {
      const date = parseDate(newValue);
      if (date) {
        setSelectedDate(date);
        onChange(formatDate(date));
      } else {
        // Si no es una fecha válida, solo actualizar el input pero no llamar onChange
        // Esto permite al usuario escribir libremente
      }
    }
  };

  // Manejar selección de fecha
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    if (showTime) {
      const formatted = formatDateTime(date, selectedTime);
      setInputValue(formatted);
      onChange(formatted);
    } else {
      const formatted = formatDate(date);
      setInputValue(formatted);
      onChange(formatted);
    }
    setIsOpen(false);
  };

  // Manejar cambio de hora
  const handleTimeChange = (type: 'hours' | 'minutes', value: string) => {
    const newTime = { ...selectedTime, [type]: value };
    setSelectedTime(newTime);
    
    if (selectedDate) {
      const formatted = formatDateTime(selectedDate, newTime);
      setInputValue(formatted);
      onChange(formatted);
    }
  };

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Generar días del mes
  const generateDays = () => {
    if (!selectedDate) return [];
    
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Días del mes anterior
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const day = new Date(year, month, -i);
      days.push({ date: day, isCurrentMonth: false });
    }
    
    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({ date, isCurrentMonth: true });
    }
    
    // Días del mes siguiente para completar la grilla
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({ date, isCurrentMonth: false });
    }
    
    return days;
  };

  // Navegar entre meses
  const navigateMonth = (direction: 'prev' | 'next') => {
    if (!selectedDate) return;
    
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setSelectedDate(newDate);
  };

  const today = new Date();
  const currentMonth = selectedDate || today;
  const days = generateDays();
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        {showTime ? (
          <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        ) : (
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        )}
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onClick={() => setIsOpen(true)}
          onBlur={() => {
            // Validar y formatear cuando el usuario termine de escribir
            if (showTime) {
              const { date, time } = parseDateTime(inputValue);
              if (date) {
                const formatted = formatDateTime(date, time);
                setInputValue(formatted);
                onChange(formatted);
              }
            } else {
              const date = parseDate(inputValue);
              if (date) {
                const formatted = formatDate(date);
                setInputValue(formatted);
                onChange(formatted);
              }
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full pl-10 pr-10 py-2 text-sm border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          {showTime ? <Clock className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
        </button>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-[9999] mt-1 w-full bg-background border border-input rounded-md shadow-lg max-h-80 overflow-y-auto">
          {/* Header del calendario */}
          <div className="flex items-center justify-between p-3 border-b border-input">
            <button
              type="button"
              onClick={() => navigateMonth('prev')}
              className="p-1 hover:bg-muted rounded"
            >
              ←
            </button>
            <span className="text-sm font-medium">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <button
              type="button"
              onClick={() => navigateMonth('next')}
              className="p-1 hover:bg-muted rounded"
            >
              →
            </button>
          </div>

          {/* Días de la semana */}
          <div className="grid grid-cols-7 gap-1 p-2">
            {dayNames.map(day => (
              <div key={day} className="text-xs text-center text-muted-foreground py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Días del mes */}
          <div className="grid grid-cols-7 gap-1 p-2">
            {days.map(({ date, isCurrentMonth }, index) => {
              const isToday = date.toDateString() === today.toDateString();
              const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
              
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleDateSelect(date)}
                  className={`
                    text-xs p-2 rounded hover:bg-muted
                    ${!isCurrentMonth ? 'text-muted-foreground' : 'text-foreground'}
                    ${isToday ? 'bg-primary text-primary-foreground' : ''}
                    ${isSelected ? 'bg-accent text-accent-foreground' : ''}
                  `}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          {/* Selector de hora si showTime es true */}
          {showTime && (
            <div className="border-t border-input p-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-muted-foreground">Hora:</span>
                <select
                  value={selectedTime.hours}
                  onChange={(e) => handleTimeChange('hours', e.target.value)}
                  className="text-xs border border-input rounded px-2 py-1 bg-background"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i.toString().padStart(2, '0')}>
                      {i.toString().padStart(2, '0')}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-muted-foreground">:</span>
                <select
                  value={selectedTime.minutes}
                  onChange={(e) => handleTimeChange('minutes', e.target.value)}
                  className="text-xs border border-input rounded px-2 py-1 bg-background"
                >
                  {Array.from({ length: 60 }, (_, i) => (
                    <option key={i} value={i.toString().padStart(2, '0')}>
                      {i.toString().padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DatePicker;