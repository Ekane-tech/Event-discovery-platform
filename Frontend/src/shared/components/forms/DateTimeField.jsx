import { CalendarClock } from 'lucide-react'
import { useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

function parseDateTimeLocal(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function pad(value) { return String(value).padStart(2, '0') }

function formatDateTimeLocal(date) {
  if (!date) return ''
  return [date.getFullYear(), '-', pad(date.getMonth() + 1), '-', pad(date.getDate()), 'T', pad(date.getHours()), ':', pad(date.getMinutes())].join('')
}

function isSameDay(dateA, dateB) {
  return dateA?.getFullYear() === dateB?.getFullYear() && dateA?.getMonth() === dateB?.getMonth() && dateA?.getDate() === dateB?.getDate()
}

function atTime(hours, minutes) {
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)
  return date
}

export default function DateTimeField({ label, helper, value, onChange, name, required = false, disablePast = true, className = '' }) {
  const [open, setOpen] = useState(false)
  const selectedDate = parseDateTimeLocal(value)
  const now = new Date()
  const minSelectableDate = disablePast ? now : undefined
  const selectedIsToday = selectedDate && isSameDay(selectedDate, now)
  const minSelectableTime = disablePast && selectedIsToday ? now : atTime(0, 0)
  const maxSelectableTime = atTime(23, 45)

  function handleDateChange(date) {
    const previousDate = selectedDate
    onChange({ target: { name, value: formatDateTimeLocal(date) } })
    if (date && previousDate && isSameDay(date, previousDate) && (date.getHours() !== previousDate.getHours() || date.getMinutes() !== previousDate.getMinutes())) {
      setOpen(false)
    }
  }

  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-slate-700">{label}{required && <span className="text-red-500"> *</span>}</span>
      <div className="relative rounded-2xl bg-gradient-to-r from-teal-50 to-blue-50 p-[1px] shadow-sm">
        <span className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-teal-700"><CalendarClock className="h-5 w-5" /></span>
        <DatePicker
          selected={selectedDate}
          open={open}
          onInputClick={() => setOpen(true)}
          onClickOutside={() => setOpen(false)}
          onCalendarClose={() => setOpen(false)}
          onChange={handleDateChange}
          showTimeSelect
          timeIntervals={15}
          dateFormat="MMM d, yyyy h:mm aa"
          placeholderText="Select date and time"
          wrapperClassName="w-full"
          popperClassName="z-50 mboa-datepicker-popper"
          popperPlacement="bottom"
          showPopperArrow={false}
          shouldCloseOnSelect={false}
          calendarClassName="rounded-2xl border border-slate-200 shadow-xl"
          className={`relative h-12 w-full rounded-2xl border-0 bg-white pl-12 pr-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 hover:bg-slate-50 focus:bg-white focus:ring-4 focus:ring-teal-100 ${className}`}
          isClearable={!required}
          required={required}
          minDate={minSelectableDate}
          minTime={minSelectableTime}
          maxTime={maxSelectableTime}
          filterTime={(time) => !disablePast || time.getTime() >= now.getTime() || !isSameDay(time, now)}
        />
      </div>
      {helper && <p className="mt-1 text-xs text-slate-500">{helper}</p>}
    </label>
  )
}
