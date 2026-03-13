'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Square, Plus, Clock } from 'lucide-react';
import { TimeEntry } from '@/lib/data';
import { useAppData } from '@/lib/contexts/AppDataContext';

interface TimeTrackerProps {
  taskId: string;
  clientId: string;
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}h ${m > 0 ? m + 'm' : ''}`.trim();
  return `${m}m`;
}

function formatTimer(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function TimeTracker({ taskId, clientId }: TimeTrackerProps) {
  const { TIME_ENTRIES = [], TEAM_MEMBERS = [] } = useAppData();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  useEffect(() => {
    setEntries(TIME_ENTRIES.filter(e => e.taskId === taskId));
  }, [TIME_ENTRIES, taskId]);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [showManual, setShowManual] = useState(false);
  const [manualHours, setManualHours] = useState('');
  const [manualMinutes, setManualMinutes] = useState('');
  const [manualNote, setManualNote] = useState('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  useEffect(() => {
    if (running) {
      startTimeRef.current = new Date();
      intervalRef.current = setInterval(() => {
        setElapsed(e => e + 1);
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const handleStop = () => {
    setRunning(false);
    const minutes = Math.round(elapsed / 60);
    if (minutes > 0) {
      const entry: TimeEntry = {
        id: `te-new-${Date.now()}`,
        taskId,
        clientId,
        memberId: 'joe',
        date: new Date().toISOString().split('T')[0],
        durationMinutes: minutes,
        note: 'Timer entry',
      };
      setEntries(prev => [...prev, entry]);
    }
    setElapsed(0);
  };

  const handleManualAdd = () => {
    const h = parseInt(manualHours || '0');
    const m = parseInt(manualMinutes || '0');
    const total = h * 60 + m;
    if (total <= 0) return;

    const entry: TimeEntry = {
      id: `te-manual-${Date.now()}`,
      taskId,
      clientId,
      memberId: 'joe',
      date: new Date().toISOString().split('T')[0],
      durationMinutes: total,
      note: manualNote || undefined,
    };
    setEntries(prev => [...prev, entry]);
    setManualHours('');
    setManualMinutes('');
    setManualNote('');
    setShowManual(false);
  };

  const totalMinutes = entries.reduce((s, e) => s + e.durationMinutes, 0);

  return (
    <div className="border-t border-gray-100 dark:border-gray-700 pt-4 mt-2">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <Clock size={11} />
          Time Tracking
        </div>
        <div className="text-xs font-medium text-[#3B5BDB]">
          Total: {formatDuration(totalMinutes)}
        </div>
      </div>

      {/* Timer */}
      <div className="flex items-center gap-2 mb-3">
        {running ? (
          <>
            <div className="flex-1 font-mono text-base font-bold text-[#3B5BDB] bg-[#EEF2FF] dark:bg-indigo-900/20 px-3 py-2 rounded-lg text-center">
              {formatTimer(elapsed)}
            </div>
            <button
              onClick={handleStop}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition-colors"
            >
              <Square size={11} />
              Stop
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setRunning(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition-colors"
            >
              <Play size={11} />
              Start Timer
            </button>
            <button
              onClick={() => setShowManual(!showManual)}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-lg text-xs font-medium transition-colors"
            >
              <Plus size={11} />
              Manual
            </button>
          </>
        )}
      </div>

      {/* Manual entry form */}
      {showManual && !running && (
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-3">
          <div className="flex gap-2 mb-2">
            <div className="flex-1">
              <label className="block text-[10px] text-gray-400 mb-1">Hours</label>
              <input
                type="number"
                min="0"
                max="23"
                value={manualHours}
                onChange={e => setManualHours(e.target.value)}
                placeholder="0"
                className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[10px] text-gray-400 mb-1">Minutes</label>
              <input
                type="number"
                min="0"
                max="59"
                value={manualMinutes}
                onChange={e => setManualMinutes(e.target.value)}
                placeholder="0"
                className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
            </div>
          </div>
          <input
            type="text"
            value={manualNote}
            onChange={e => setManualNote(e.target.value)}
            placeholder="Note (optional)"
            className="w-full text-xs border border-gray-200 dark:border-gray-600 rounded px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 mb-2"
          />
          <button
            onClick={handleManualAdd}
            className="w-full px-3 py-1.5 bg-[#3B5BDB] hover:bg-[#3B5BDB] text-white rounded text-xs font-medium transition-colors"
          >
            Add Entry
          </button>
        </div>
      )}

      {/* Time log */}
      {entries.length > 0 && (
        <div className="space-y-1.5">
          {entries.slice(-4).map(entry => {
            const member = TEAM_MEMBERS.find(m => m.id === entry.memberId);
            return (
              <div key={entry.id} className="flex items-center gap-2 text-xs">
                <div
                  className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold flex-shrink-0"
                  style={{ backgroundColor: member?.color }}
                >
                  {member?.initials}
                </div>
                <span className="text-gray-400">
                  {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {formatDuration(entry.durationMinutes)}
                </span>
                {entry.note && <span className="text-gray-400 truncate flex-1">{entry.note}</span>}
              </div>
            );
          })}
          {entries.length > 4 && (
            <p className="text-[10px] text-gray-400">+{entries.length - 4} more entries</p>
          )}
        </div>
      )}
    </div>
  );
}
