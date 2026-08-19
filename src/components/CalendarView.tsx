import React, { useState } from 'react';
import { ProductionProject } from '../types';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  User, 
  Camera, 
  Video, 
  CheckCircle2, 
  AlertTriangle,
  Sparkles,
  Filter,
  Eye,
  ListOrdered,
  CalendarDays,
  Film,
  BookOpen,
  Banknote,
  HardDrive,
  Check,
  ChevronDown,
  X
} from 'lucide-react';

interface CalendarViewProps {
  projects: ProductionProject[];
  currentStaffId?: string;
  onOpenProject: (project: ProductionProject) => void;
}

type MainCalendarTab = 'grid' | 'timeline';
type CalendarGridMode = 'month' | 'week' | 'year';
type MilestoneFilter = 'all' | 'events' | 'usb' | 'photobook' | 'payment_7pm';

interface DeliveryMilestone {
  id: string;
  projectId: string;
  project: ProductionProject;
  date: string; // YYYY-MM-DD
  time?: string;
  type: 'event' | 'usb_delivery' | 'photobook_delivery' | 'field_payment' | 'ingest' | 'conformity';
  title: string;
  description: string;
  status: 'pending' | 'completed' | 'overdue';
  daysRemaining: number;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  projects,
  currentStaffId,
  onOpenProject
}) => {
  const [activeTab, setActiveTab] = useState<MainCalendarTab>('timeline'); // Default to chronological timeline as requested
  const [gridMode, setGridMode] = useState<CalendarGridMode>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>('all');
  const [selectedEventType, setSelectedEventType] = useState<string>('all');
  const [selectedMilestoneFilter, setSelectedMilestoneFilter] = useState<MilestoneFilter>('all');
  const [selectedDayDetails, setSelectedDayDetails] = useState<{ dateStr: string; milestones: DeliveryMilestone[] } | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  // Helper to add days to ISO string
  const addDaysToDate = (baseIso: string, days: number): string => {
    try {
      const d = new Date(baseIso + 'T12:00:00');
      d.setDate(d.getDate() + days);
      return d.toISOString().split('T')[0];
    } catch {
      return baseIso;
    }
  };

  // Helper to calculate days difference
  const getDaysDifference = (targetIso: string): number => {
    try {
      const target = new Date(targetIso + 'T12:00:00').getTime();
      const today = new Date(todayStr + 'T12:00:00').getTime();
      return Math.round((target - today) / (1000 * 60 * 60 * 24));
    } catch {
      return 0;
    }
  };

  // Filter active projects
  const visibleProjects = projects.filter(p => {
    if (p.isArchived) return false;
    
    if (selectedStaffFilter !== 'all') {
      const hasStaff = p.assignedStaff.some(s => s.id === selectedStaffFilter || s.name === selectedStaffFilter);
      if (!hasStaff) return false;
    }

    if (currentStaffId) {
      const hasStaff = p.assignedStaff.some(s => s.id === currentStaffId);
      if (!hasStaff) return false;
    }

    if (selectedEventType !== 'all' && p.eventType !== selectedEventType) {
      return false;
    }

    return true;
  });

  // Extract all unique staff
  const allStaff: { id: string; name: string; role: string }[] = [];
  projects.forEach(p => {
    p.assignedStaff.forEach(s => {
      if (!allStaff.some(existing => existing.name === s.name)) {
        allStaff.push({ id: s.id, name: s.name, role: s.role });
      }
    });
  });

  // Calculate all delivery milestones across visible active projects
  const allMilestones: DeliveryMilestone[] = [];

  visibleProjects.forEach(p => {
    // 1. Event Rodaje Date (Paso 5)
    const eventDaysDiff = getDaysDifference(p.eventDate);
    const isStep5Done = p.phases[2]?.steps[0]?.status === 'completed';
    allMilestones.push({
      id: `${p.id}-event`,
      projectId: p.id,
      project: p,
      date: p.eventDate,
      time: p.eventTime || '09:00 AM',
      type: 'event',
      title: `🎬 Rodaje en Vivo: ${p.title}`,
      description: `Locación: ${p.eventLocation} • Horario: ${p.eventTime || 'Por confirmar'}`,
      status: isStep5Done ? 'completed' : eventDaysDiff < 0 ? 'overdue' : 'pending',
      daysRemaining: eventDaysDiff
    });

    // 2. Field Payment 7:00 PM (Paso 6)
    const isStep6Done = p.phases[2]?.steps[1]?.status === 'completed';
    const pendingBalance = Math.max(0, p.totalBudget - p.initialDeposit - (p.fieldPayment || 0));
    if (pendingBalance > 0) {
      allMilestones.push({
        id: `${p.id}-payment`,
        projectId: p.id,
        project: p,
        date: p.eventDate,
        time: '19:00 PM',
        type: 'field_payment',
        title: `💰 Cobro en Campo (7:00 PM): S/. ${pendingBalance.toLocaleString()}`,
        description: `Regla obligatoria de liquidación in situ antes de la cena`,
        status: isStep6Done ? 'completed' : eventDaysDiff < 0 ? 'overdue' : 'pending',
        daysRemaining: eventDaysDiff
      });
    }

    // 3. USB 15 Days Video Delivery (Paso 8 - Edición & Masterización)
    const usbDate = addDaysToDate(p.eventDate, 15);
    const usbDaysDiff = getDaysDifference(usbDate);
    const isStep8Done = p.phases[3]?.steps[0]?.status === 'completed';
    allMilestones.push({
      id: `${p.id}-usb`,
      projectId: p.id,
      project: p,
      date: usbDate,
      time: '18:00 PM',
      type: 'usb_delivery',
      title: `🎞️ Entrega de Video USB 4K (SLA 15 días)`,
      description: `Trailer Highlight + Película Completa ProRes 4K masterizada`,
      status: isStep8Done ? 'completed' : usbDaysDiff < 0 ? 'overdue' : 'pending',
      daysRemaining: usbDaysDiff
    });

    // 4. Photobook 30 Days Delivery (Paso 9 / 11) if included
    if (p.includesPhotobook) {
      const bookDate = addDaysToDate(p.eventDate, 30);
      const bookDaysDiff = getDaysDifference(bookDate);
      const isStep9Done = p.phases[4]?.steps[0]?.status === 'completed';
      allMilestones.push({
        id: `${p.id}-photobook`,
        projectId: p.id,
        project: p,
        date: bookDate,
        time: '18:00 PM',
        type: 'photobook_delivery',
        title: `📖 Entrega de Fotolibro de Lujo (SLA 30 días)`,
        description: `Impresión offset con tapa dura grabada y pliegos aprobados`,
        status: isStep9Done ? 'completed' : bookDaysDiff < 0 ? 'overdue' : 'pending',
        daysRemaining: bookDaysDiff
      });
    }
  });

  // Filtered milestones based on milestone filter
  const filteredMilestones = allMilestones.filter(m => {
    if (selectedMilestoneFilter === 'events') return m.type === 'event';
    if (selectedMilestoneFilter === 'usb') return m.type === 'usb_delivery';
    if (selectedMilestoneFilter === 'photobook') return m.type === 'photobook_delivery';
    if (selectedMilestoneFilter === 'payment_7pm') return m.type === 'field_payment';
    return true;
  });

  // Chronologically sorted milestones (earliest to latest)
  const sortedMilestones = [...filteredMilestones].sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  // Month navigation
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const currentMonthName = monthNames[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear();

  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (gridMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (gridMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setFullYear(newDate.getFullYear() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (gridMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (gridMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setFullYear(newDate.getFullYear() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getMilestonesOnDate = (dateStr: string) => {
    return filteredMilestones.filter(m => m.date === dateStr);
  };

  // Group timeline milestones by time proximity
  const todayMilestones = sortedMilestones.filter(m => m.daysRemaining === 0);
  const overdueMilestones = sortedMilestones.filter(m => m.daysRemaining < 0 && m.status !== 'completed');
  const thisWeekMilestones = sortedMilestones.filter(m => m.daysRemaining > 0 && m.daysRemaining <= 7);
  const nextTwoWeeksMilestones = sortedMilestones.filter(m => m.daysRemaining > 7 && m.daysRemaining <= 21);
  const futureMilestones = sortedMilestones.filter(m => m.daysRemaining > 21);
  const completedPastMilestones = sortedMilestones.filter(m => m.daysRemaining < 0 && m.status === 'completed');

  const renderMilestoneCard = (m: DeliveryMilestone) => {
    const isOverdue = m.status === 'overdue';
    const isCompleted = m.status === 'completed';
    const isToday = m.daysRemaining === 0;

    let badgeBg = 'bg-slate-100 text-slate-700';
    let badgeText = `${m.daysRemaining} días`;
    if (isCompleted) {
      badgeBg = 'bg-emerald-100 text-emerald-800 border-emerald-300';
      badgeText = '✓ Cumplido';
    } else if (isToday) {
      badgeBg = 'bg-amber-400 text-slate-950 font-black animate-pulse';
      badgeText = '¡HOY!';
    } else if (isOverdue) {
      badgeBg = 'bg-red-600 text-white font-black animate-pulse';
      badgeText = `+${Math.abs(m.daysRemaining)}d vencido`;
    } else if (m.daysRemaining <= 3) {
      badgeBg = 'bg-amber-100 text-amber-900 border-amber-300 font-black';
      badgeText = `En ${m.daysRemaining} días`;
    }

    return (
      <div
        key={m.id}
        className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
          isOverdue 
            ? 'bg-red-50/70 border-red-300 hover:border-red-500 shadow-xs' 
            : isToday 
            ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-400/20 shadow-sm'
            : isCompleted
            ? 'bg-white/80 border-slate-200 opacity-80'
            : 'bg-white border-slate-200 hover:border-amber-400 hover:shadow-md'
        }`}
      >
        <div className="space-y-2">
          {/* Top row: Date, badge, code */}
          <div className="flex items-center justify-between flex-wrap gap-1.5">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-black bg-slate-900 text-amber-400 px-2 py-0.5 rounded">
                {m.project.uniqueCode}
              </span>
              <span className="text-[11px] font-bold text-slate-600">
                📅 {m.date} {m.time ? `• ${m.time}` : ''}
              </span>
            </div>

            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeBg}`}>
              {badgeText}
            </span>
          </div>

          {/* Title and description */}
          <div>
            <h4 className="text-xs sm:text-sm font-black text-slate-900 line-clamp-1">
              {m.title}
            </h4>
            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
              {m.description}
            </p>
          </div>

          {/* Client & Staff Info */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2 text-[11px] text-slate-600">
            <div className="flex items-center space-x-1.5 truncate">
              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-bold text-slate-800 truncate">{m.project.clientName}</span>
              <span className="text-slate-400">({m.project.eventType})</span>
            </div>

            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
              👤 {m.project.assignedStaff[0]?.name.split(' ')[0] || m.project.contractHolder || 'Equipo TCT'}
            </span>
          </div>
        </div>

        {/* Action button */}
        <button
          type="button"
          onClick={() => onOpenProject(m.project)}
          className="w-full mt-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Ver Expediente y Pasos</span>
        </button>
      </div>
    );
  };

  // Month grid renderer
  const renderMonthGrid = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const startOffset = (firstDayIndex + 6) % 7;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days = [];

    // Prev month days
    for (let i = startOffset - 1; i >= 0; i--) {
      const prevDay = daysInPrevMonth - i;
      const prevDate = new Date(year, month - 1, prevDay);
      const iso = prevDate.toISOString().split('T')[0];
      days.push({ dayNumber: prevDay, iso, isCurrentMonth: false, milestones: getMilestonesOnDate(iso) });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const mStr = String(month + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      const iso = `${year}-${mStr}-${dStr}`;
      days.push({ dayNumber: d, iso, isCurrentMonth: true, milestones: getMilestonesOnDate(iso) });
    }

    // Next month days
    const totalCells = days.length <= 35 ? 35 : 42;
    const remaining = totalCells - days.length;
    for (let d = 1; d <= remaining; d++) {
      const mStr = String(month + 2 > 12 ? 1 : month + 2).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      const nextYear = month + 2 > 12 ? year + 1 : year;
      const iso = `${nextYear}-${mStr}-${dStr}`;
      days.push({ dayNumber: d, iso, isCurrentMonth: false, milestones: getMilestonesOnDate(iso) });
    }

    const dayHeaders = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    return (
      <div className="space-y-2">
        {/* Day of Week Headers */}
        <div className="grid grid-cols-7 gap-1 text-center font-black text-xs text-slate-500 py-1 uppercase">
          {dayHeaders.map((dh, i) => (
            <div key={i} className="truncate">{dh}</div>
          ))}
        </div>

        {/* Days Matrix */}
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {days.map((dayObj, idx) => {
            const isToday = dayObj.iso === todayStr;
            const hasMilestones = dayObj.milestones.length > 0;

            return (
              <div
                key={idx}
                onClick={() => {
                  if (hasMilestones) {
                    setSelectedDayDetails({ dateStr: dayObj.iso, milestones: dayObj.milestones });
                  }
                }}
                className={`min-h-[75px] sm:min-h-[105px] p-1.5 sm:p-2 rounded-xl border flex flex-col justify-between transition-all ${
                  hasMilestones ? 'cursor-pointer hover:ring-2 hover:ring-amber-400' : ''
                } ${
                  isToday 
                    ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-400/30' 
                    : dayObj.isCurrentMonth
                    ? 'bg-white border-slate-200'
                    : 'bg-slate-50/60 border-slate-100 text-slate-300'
                }`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between">
                  <span className={`text-xs sm:text-sm font-black ${
                    isToday 
                      ? 'text-amber-600' 
                      : dayObj.isCurrentMonth ? 'text-slate-800' : 'text-slate-400'
                  }`}>
                    {dayObj.dayNumber}
                  </span>
                  {hasMilestones && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse sm:hidden"></span>
                  )}
                </div>

                {/* Milestone Chips */}
                <div className="space-y-1 mt-1 overflow-hidden">
                  {dayObj.milestones.slice(0, 2).map(m => (
                    <div
                      key={m.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenProject(m.project);
                      }}
                      className={`text-[9px] sm:text-[10px] p-1 rounded font-bold truncate leading-tight transition-colors ${
                        m.type === 'event' 
                          ? 'bg-slate-900 text-amber-300 hover:bg-slate-800' 
                          : m.type === 'usb_delivery'
                          ? 'bg-purple-100 text-purple-900 border border-purple-200'
                          : m.type === 'photobook_delivery'
                          ? 'bg-pink-100 text-pink-900 border border-pink-200'
                          : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                      }`}
                      title={`${m.title} (${m.project.uniqueCode})`}
                    >
                      <span className="hidden sm:inline">[{m.project.uniqueCode.split('-').pop()}] </span>
                      {m.type === 'event' ? '🎬 Rodaje' : m.type === 'usb_delivery' ? '🎞️ USB 15d' : m.type === 'photobook_delivery' ? '📖 Libro 30d' : '💰 S/.'}
                    </div>
                  ))}
                  {dayObj.milestones.length > 2 && (
                    <span className="text-[9px] text-amber-700 font-extrabold block text-center">
                      +{dayObj.milestones.length - 2} más
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      
      {/* Top Header & View Mode Switcher */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500 text-slate-950 font-black shadow-xs shrink-0">
              <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  Calendario de Entregas & Eventos Cronológicos
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  {visibleProjects.length} producciones activas
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Supervisión de fechas de rodaje, cobros en campo 7:00 PM y plazos SLA de video (15d) y fotolibros (30d)
              </p>
            </div>
          </div>

          {/* Tab Switcher: Cronograma Timeline vs Calendario Mensual */}
          <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab('timeline')}
              className={`flex-1 sm:flex-none px-3.5 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'timeline'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-950'
              }`}
            >
              <ListOrdered className="w-4 h-4 text-amber-400" />
              <span>Cronograma de Entregas</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('grid')}
              className={`flex-1 sm:flex-none px-3.5 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'grid'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-950'
              }`}
            >
              <CalendarDays className="w-4 h-4 text-amber-400" />
              <span>Vista Calendario Mes</span>
            </button>
          </div>
        </div>

        {/* Milestone Filters & Staff Selector */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
          
          {/* Milestone Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs font-bold scrollbar-thin">
            <span className="text-slate-400 text-[11px] flex items-center gap-1 shrink-0">
              <Filter className="w-3.5 h-3.5" /> Hitos:
            </span>

            <button
              type="button"
              onClick={() => setSelectedMilestoneFilter('all')}
              className={`px-2.5 py-1.5 rounded-xl transition-colors shrink-0 ${
                selectedMilestoneFilter === 'all'
                  ? 'bg-slate-900 text-white font-black'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Todos ({allMilestones.length})
            </button>

            <button
              type="button"
              onClick={() => setSelectedMilestoneFilter('events')}
              className={`px-2.5 py-1.5 rounded-xl transition-colors shrink-0 ${
                selectedMilestoneFilter === 'events'
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              🎬 Rodajes ({allMilestones.filter(m => m.type === 'event').length})
            </button>

            <button
              type="button"
              onClick={() => setSelectedMilestoneFilter('usb')}
              className={`px-2.5 py-1.5 rounded-xl transition-colors shrink-0 ${
                selectedMilestoneFilter === 'usb'
                  ? 'bg-purple-600 text-white font-black'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              🎞️ Video USB 15d ({allMilestones.filter(m => m.type === 'usb_delivery').length})
            </button>

            <button
              type="button"
              onClick={() => setSelectedMilestoneFilter('photobook')}
              className={`px-2.5 py-1.5 rounded-xl transition-colors shrink-0 ${
                selectedMilestoneFilter === 'photobook'
                  ? 'bg-pink-600 text-white font-black'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              📖 Fotolibros 30d ({allMilestones.filter(m => m.type === 'photobook_delivery').length})
            </button>

            <button
              type="button"
              onClick={() => setSelectedMilestoneFilter('payment_7pm')}
              className={`px-2.5 py-1.5 rounded-xl transition-colors shrink-0 ${
                selectedMilestoneFilter === 'payment_7pm'
                  ? 'bg-emerald-600 text-white font-black'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              💰 Cobros 7PM ({allMilestones.filter(m => m.type === 'field_payment').length})
            </button>
          </div>

          {/* Staff Filter Dropdown */}
          <div className="flex items-center space-x-2 shrink-0">
            <select
              value={selectedStaffFilter}
              onChange={(e) => setSelectedStaffFilter(e.target.value)}
              className="w-full sm:w-auto p-2 border border-slate-200 rounded-xl text-xs bg-white font-semibold text-slate-800"
            >
              <option value="all">👥 Todo el Personal Técnico</option>
              {allStaff.map(st => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.role.split(' ')[0]})
                </option>
              ))}
            </select>
          </div>

        </div>

      </div>

      {/* Main Tab 1: Chronological Timeline View */}
      {activeTab === 'timeline' && (
        <div className="space-y-6">
          
          {/* Section: Overdue Alerts (Vencidos) */}
          {overdueMilestones.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-red-600 animate-ping"></span>
                <h3 className="text-sm font-black text-red-700 uppercase tracking-wider">
                  ⚠️ Plazos Vencidos / Alerta de Entrega ({overdueMilestones.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {overdueMilestones.map(renderMilestoneCard)}
              </div>
            </div>
          )}

          {/* Section: Today's Deliveries / Events (Hoy) */}
          {todayMilestones.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse"></span>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  ⚡ Entregas & Rodajes para HOY ({todayMilestones.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {todayMilestones.map(renderMilestoneCard)}
              </div>
            </div>
          )}

          {/* Section: This Week (Próximos 7 días) */}
          {thisWeekMilestones.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <span>🗓️ Próximos 7 Días (Esta Semana)</span>
                <span className="text-xs font-normal text-slate-500">({thisWeekMilestones.length} fechas clave)</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {thisWeekMilestones.map(renderMilestoneCard)}
              </div>
            </div>
          )}

          {/* Section: Next Two Weeks (8 a 21 días) */}
          {nextTwoWeeksMilestones.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <span>📅 En 2 a 3 Semanas</span>
                <span className="text-xs font-normal text-slate-500">({nextTwoWeeksMilestones.length} entregables)</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {nextTwoWeeksMilestones.map(renderMilestoneCard)}
              </div>
            </div>
          )}

          {/* Section: Future Milestones (> 21 días) */}
          {futureMilestones.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <span>🚀 Fechas Futuras Programadas</span>
                <span className="text-xs font-normal text-slate-500">({futureMilestones.length} entregables)</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {futureMilestones.map(renderMilestoneCard)}
              </div>
            </div>
          )}

          {sortedMilestones.length === 0 && (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h4 className="text-base font-black text-slate-900">Sin fechas pendientes con este filtro</h4>
              <p className="text-xs text-slate-500">Todas las producciones activas están al día.</p>
            </div>
          )}

        </div>
      )}

      {/* Main Tab 2: Monthly Grid View */}
      {activeTab === 'grid' && (
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          
          {/* Month Navigator */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                {currentMonthName} {currentYear}
              </h3>
              <button
                type="button"
                onClick={handleToday}
                className="px-2 py-0.5 rounded-md bg-amber-100 hover:bg-amber-200 text-amber-950 text-xs font-extrabold transition-colors"
              >
                Hoy
              </button>
            </div>

            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={handlePrev}
                className="p-1.5 rounded-lg hover:bg-white text-slate-700 transition-colors"
                title="Mes Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="p-1.5 rounded-lg hover:bg-white text-slate-700 transition-colors"
                title="Mes Siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Month Matrix */}
          {renderMonthGrid()}

        </div>
      )}

      {/* Day Details Modal (when tapping a day in grid view) */}
      {selectedDayDetails && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-5 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] flex flex-col">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Hitos para {selectedDayDetails.dateStr}
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    {selectedDayDetails.milestones.length} entregas / eventos en esta fecha
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDayDetails(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto flex-1 pr-1">
              {selectedDayDetails.milestones.map(renderMilestoneCard)}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedDayDetails(null)}
                className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
