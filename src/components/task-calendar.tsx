'use client'

import { useState, useCallback, useMemo } from 'react'
import { Calendar, dateFnsLocalizer, Views, View } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { TaskWithRelations } from '@/types'
import { 
  tasksToCalendarEvents, 
  getTaskEventStyle, 
  formatCalendarDate,
  CalendarEvent
} from '@/lib/calendar-utils'
import 'react-big-calendar/lib/css/react-big-calendar.css'

// Configure date-fns localizer
const locales = {
  'en-US': enUS,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

interface TaskCalendarProps {
  tasks: TaskWithRelations[]
  onTaskUpdate: (taskId: string, data: any) => void
  onTaskSelect: (task: TaskWithRelations) => void
  onDateSelect: (date: Date) => void
  loading?: boolean
}

export function TaskCalendar({ 
  tasks, 
  onTaskUpdate, 
  onTaskSelect, 
  onDateSelect,
  loading = false 
}: TaskCalendarProps) {
  const [currentView, setCurrentView] = useState<View>(Views.MONTH)
  const [currentDate, setCurrentDate] = useState(new Date())

  // Convert tasks to calendar events
  const events = useMemo(() => tasksToCalendarEvents(tasks), [tasks])

  // Handle event selection (task click)
  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    onTaskSelect(event.resource)
  }, [onTaskSelect])

  // Handle date/slot selection (empty space click)
  const handleSelectSlot = useCallback(({ start }: { start: Date }) => {
    onDateSelect(start)
  }, [onDateSelect])

  // Handle event drag-and-drop
  const handleEventDrop = useCallback(({ event, start }: { event: CalendarEvent, start: Date }) => {
    const updatedDueDate = new Date(start)
    onTaskUpdate(event.id, { dueDate: updatedDueDate })
  }, [onTaskUpdate])

  // Custom event component with styling
  const EventComponent = ({ event }: { event: CalendarEvent }) => {
    const style = getTaskEventStyle(event.resource)
    
    return (
      <div style={style} className="calendar-event">
        <div className="flex items-center space-x-1">
          {event.resource.completed && (
            <span className="text-xs">✓</span>
          )}
          <span className="truncate">{event.title}</span>
          {event.resource.isRecurring && (
            <span className="text-xs">↻</span>
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading calendar...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow border">
      {/* Calendar Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          {formatCalendarDate(currentDate)}
        </h2>
        
        {/* View Selector */}
        <div className="flex space-x-1">
          {[
            { key: Views.MONTH, label: 'Month' },
            { key: Views.WEEK, label: 'Week' },
            { key: Views.DAY, label: 'Day' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setCurrentView(key)}
              className={`px-3 py-1 text-sm rounded ${
                currentView === key
                  ? 'bg-blue-100 text-blue-900 border border-blue-200'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar */}
      <div className="p-4" style={{ height: '600px' }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          view={currentView}
          onView={setCurrentView}
          date={currentDate}
          onNavigate={setCurrentDate}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          onEventDrop={handleEventDrop}
          selectable
          resizable={false}
          draggableAccessor={() => true}
          components={{
            event: EventComponent,
          }}
          eventPropGetter={(event: CalendarEvent) => ({
            style: getTaskEventStyle(event.resource),
          })}
          dayPropGetter={(date) => {
            const today = new Date()
            const isToday = date.toDateString() === today.toDateString()
            
            return {
              style: isToday ? { backgroundColor: '#f0f9ff' } : {},
            }
          }}
          formats={{
            monthHeaderFormat: 'MMMM yyyy',
            dayHeaderFormat: 'dddd, MMMM do',
            dayRangeHeaderFormat: ({ start, end }) => 
              `${format(start, 'MMM do')} - ${format(end, 'MMM do, yyyy')}`,
          }}
        />
      </div>

      {/* Legend */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex flex-wrap items-center space-x-4 text-xs">
          <span className="font-medium text-gray-700">Legend:</span>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded bg-green-500"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded bg-red-500"></div>
            <span>Overdue</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded bg-orange-500"></div>
            <span>Urgent</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded bg-yellow-500"></div>
            <span>High</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded bg-blue-500"></div>
            <span>Medium</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded bg-gray-500"></div>
            <span>Low</span>
          </div>
        </div>
      </div>
    </div>
  )
}