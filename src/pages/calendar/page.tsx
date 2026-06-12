import { useState } from 'react';
import AdminLayout from '@/components/feature/AdminLayout';
import AddEventModal from './components/AddEventModal';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';

const typeLabels: Record<string, string> = {
  repair: 'Repair',
  consultation: 'Consultation',
  tradein: 'Trade-In',
  internal: 'Internal',
  marketing: 'Marketing',
  delivery: 'Delivery',
};

const typeColors: Record<string, string> = {
  repair: '#E05A2B',
  consultation: '#DC1F1F',
  tradein: '#F59E0B',
  internal: '#0F172A',
  marketing: '#F59E0B',
  delivery: '#06B6D4',
};

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const currentWeekDates = ['21', '22', '23', '24', '25', '26', '27'];
const currentDayIndex = 2; // Wednesday (23rd)

export default function CalendarPage() {
  const { events, add: addEvent, update: updateEvent } = useCalendarEvents();
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [filterType, setFilterType] = useState('all');

  const today = new Date().toISOString().split('T')[0];
  const filteredEvents = filterType === 'all' ? events : events.filter(e => e.type === filterType);
  const todayEvents = events.filter(e => e.date === today);

  const stats = [
    { label: "Today's Appts", value: String(todayEvents.length), icon: 'ri-calendar-check-line', color: '#DC1F1F' },
    { label: 'This Week', value: String(events.length), icon: 'ri-calendar-2-line', color: '#0F172A' },
    { label: 'Pending Confirm', value: String(events.filter(e => e.status === 'pending').length), icon: 'ri-time-line', color: '#F59E0B' },
    { label: 'Repair Queue', value: String(events.filter(e => e.type === 'repair').length), icon: 'ri-tools-line', color: '#E05A2B' },
    { label: 'Completed', value: String(todayEvents.filter(e => e.status === 'completed').length), icon: 'ri-check-double-line', color: '#25D366' },
  ];

  return (
    <AdminLayout title="Booking Calendar" subtitle="Repair appointments · Consultations · Staff schedule">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-5">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-4 border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${s.color}15` }}>
                <i className={`${s.icon} text-sm`} style={{ color: s.color }} />
              </div>
              <span className="text-xs text-slate-400">{s.label}</span>
            </div>
            <p className="text-xl font-bold text-slate-800">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Calendar View */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">April 2026</h3>
              <p className="text-xs text-slate-400">Week of Apr 21 - Apr 27</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 rounded-lg bg-slate-50 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                <option value="all">All Types</option>
                <option value="repair">Repairs</option>
                <option value="consultation">Consultations</option>
                <option value="tradein">Trade-Ins</option>
                <option value="delivery">Deliveries</option>
                <option value="internal">Internal</option>
                <option value="marketing">Marketing</option>
              </select>
              <button
                onClick={() => setShowAddEvent(true)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-white cursor-pointer whitespace-nowrap"
                style={{ background: '#DC1F1F' }}
              >
                <i className="ri-add-line mr-1" /> Add
              </button>
            </div>
          </div>

          {/* Week Header */}
          <div className="grid grid-cols-7 border-b border-slate-100">
            {weekDays.map((day, i) => (
              <div key={day} className={`p-3 text-center ${i === currentDayIndex ? 'bg-[rgba(220,31,31,0.05)]' : ''}`}>
                <p className="text-[10px] text-slate-400 uppercase">{day}</p>
                <p className={`text-sm font-semibold ${i === currentDayIndex ? 'text-[#DC1F1F]' : 'text-slate-700'}`}>{currentWeekDates[i]}</p>
              </div>
            ))}
          </div>

          {/* Time Slots */}
          <div className="grid grid-cols-7 divide-x divide-slate-100 min-h-[400px]">
            {weekDays.map((_, dayIndex) => {
              const dayEvents = filteredEvents.filter(e => {
                const dayNum = parseInt(currentWeekDates[dayIndex]);
                return parseInt(e.date.split('-')[2]) === dayNum;
              });
              return (
                <div key={dayIndex} className={`p-2 space-y-2 ${dayIndex === currentDayIndex ? 'bg-[rgba(220,31,31,0.03)]' : ''}`}>
                  {dayEvents.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => setSelectedEvent(selectedEvent === event.id ? null : event.id)}
                      className="w-full text-left p-2 rounded-xl transition-all cursor-pointer"
                      style={{ background: `${event.color}10`, borderLeft: `3px solid ${event.color}` }}
                    >
                      <p className="text-[10px] font-semibold" style={{ color: event.color }}>{event.time}</p>
                      <p className="text-[11px] font-medium text-slate-700 line-clamp-2">{event.title}</p>
                      <p className="text-[9px] text-slate-400">{event.customer}</p>
                      {event.status === 'pending' && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 mt-1 inline-block">Pending</span>
                      )}
                    </button>
                  ))}
                  {dayEvents.length === 0 && (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-[10px] text-slate-300">No events</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Side Panel */}
        <div className="space-y-4">
          {/* Today's Schedule */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 mb-3">Today's Schedule</h3>
            <div className="space-y-2">
              {todayEvents.map((event) => (
                <div
                  key={event.id}
                  className="p-3 rounded-xl cursor-pointer transition-all"
                  style={{ background: `${event.color}08`, borderLeft: `3px solid ${event.color}` }}
                  onClick={() => setSelectedEvent(selectedEvent === event.id ? null : event.id)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold" style={{ color: event.color }}>{event.time}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">{typeLabels[event.type]}</span>
                  </div>
                  <p className="text-xs font-medium text-slate-700 mt-1">{event.title}</p>
                  <p className="text-[10px] text-slate-400">{event.customer}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Event Detail */}
          {selectedEvent && (
            <div className="bg-white rounded-2xl p-4 border border-slate-100">
              {(() => {
                const event = events.find(e => e.id === selectedEvent);
                if (!event) return null;
                return (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-slate-800">Event Details</h3>
                      <button onClick={() => setSelectedEvent(null)} className="w-6 h-6 rounded flex items-center justify-center hover:bg-slate-100 cursor-pointer">
                        <i className="ri-close-line text-slate-400 text-xs" />
                      </button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">Title</p>
                        <p className="text-sm font-semibold text-slate-800">{event.title}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider">Customer</p>
                          <p className="text-xs text-slate-700">{event.customer}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider">Phone</p>
                          <p className="text-xs text-slate-700">{event.phone}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider">Time</p>
                          <p className="text-xs text-slate-700">{event.time} ({event.duration} min)</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider">Type</p>
                          <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ background: event.color }}>{typeLabels[event.type]}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">Notes</p>
                        <p className="text-xs text-slate-600">{event.notes}</p>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => { updateEvent(event.id, { status: 'confirmed' }); setSelectedEvent(null); }}
                          className="flex-1 py-2 rounded-lg text-xs font-semibold text-white cursor-pointer whitespace-nowrap" style={{ background: '#DC1F1F' }}>
                          Confirm
                        </button>
                        <button
                          onClick={() => { updateEvent(event.id, { status: 'rescheduled' }); setSelectedEvent(null); }}
                          className="flex-1 py-2 rounded-lg text-xs font-semibold border border-slate-200 text-slate-500 cursor-pointer whitespace-nowrap">
                          Reschedule
                        </button>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

        </div>
      </div>

      {showAddEvent && <AddEventModal onSave={addEvent} onClose={() => setShowAddEvent(false)} />}
    </AdminLayout>
  );
}