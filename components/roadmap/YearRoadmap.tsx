'use client';

import { useMemo } from 'react';
import { Calendar } from 'lucide-react';

interface Strategy {
  id: string;
  clientId: string;
  name: string;
  color?: string;
}

interface Pillar {
  id: string;
  name: string;
  color: string;
}

interface Initiative {
  id: string;
  clientId: string;
  name: string;
  startDate: string;
  endDate: string;
  clientPillarId?: string | null;
  strategyId?: string;
  progress: number;
}

interface YearRoadmapProps {
  strategies: Strategy[];
  initiatives: Initiative[];
  pillars: Pillar[];
  clientId: string;
}

// Helper: calculate pixel position within year (0-100%)
function getPositionPercent(dateStr: string, year: number): number {
  const date = new Date(`${dateStr}T00:00:00Z`);
  const yearStart = new Date(`${year}-01-01T00:00:00Z`);
  const yearEnd = new Date(`${year + 1}-01-01T00:00:00Z`);
  const msInYear = yearEnd.getTime() - yearStart.getTime();
  const msFromStart = date.getTime() - yearStart.getTime();
  const percent = Math.max(0, Math.min(100, (msFromStart / msInYear) * 100));
  return percent;
}

// Helper: calculate width of initiative bar
function getWidthPercent(startStr: string, endStr: string, year: number): number {
  const startPercent = getPositionPercent(startStr, year);
  const endPercent = getPositionPercent(endStr, year);
  return Math.max(2, endPercent - startPercent); // min 2% width for visibility
}

export default function YearRoadmap({
  strategies,
  initiatives,
  pillars,
  clientId,
}: YearRoadmapProps) {
  const currentYear = new Date().getFullYear();
  const todayPercent = useMemo(() => {
    const today = new Date();
    const yearStart = new Date(`${currentYear}-01-01T00:00:00Z`);
    const yearEnd = new Date(`${currentYear + 1}-01-01T00:00:00Z`);
    const msInYear = yearEnd.getTime() - yearStart.getTime();
    const msFromStart = today.getTime() - yearStart.getTime();
    return Math.max(0, Math.min(100, (msFromStart / msInYear) * 100));
  }, [currentYear]);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Group initiatives by strategy
  const initiativesByStrategy = useMemo(() => {
    const map: Record<string, Initiative[]> = {};
    strategies.forEach(s => {
      map[s.id] = [];
    });
    map['unlinked'] = [];

    initiatives
      .filter(i => i.clientId === clientId)
      .forEach(i => {
        if (i.strategyId && map[i.strategyId]) {
          map[i.strategyId].push(i);
        } else {
          map['unlinked'].push(i);
        }
      });

    return map;
  }, [strategies, initiatives, clientId]);

  // Helper: get pillar data for an initiative
  const getPillarForInitiative = (pillarId?: string | null) => {
    if (!pillarId) return null;
    return pillars.find(p => p.id === pillarId) || null;
  };

  // Determine which strategies to render (only those with initiatives)
  const visibleStrategies = strategies.filter(s => (initiativesByStrategy[s.id] || []).length > 0);
  const hasUnlinkedInitiatives = (initiativesByStrategy['unlinked'] || []).length > 0;

  if (strategies.length === 0 || (visibleStrategies.length === 0 && !hasUnlinkedInitiatives)) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/30">
        <Calendar size={32} className="mx-auto mb-3 opacity-30 text-gray-400" />
        <p className="text-sm font-medium text-gray-400">No strategies or initiatives defined yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Calendar size={18} style={{ color: 'var(--color-primary)' }} />
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Year Roadmap</h3>
      </div>

      {/* Roadmap Container */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-x-auto">
        {/* Month labels */}
        <div className="flex min-w-full">
          {/* Strategy label column */}
          <div className="w-48 flex-shrink-0 px-4 py-3 border-r border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50" />

          {/* Month headers */}
          <div className="flex flex-1">
            {months.map(month => (
              <div
                key={month}
                className="flex-1 px-2 py-3 text-center border-r border-gray-100 dark:border-gray-700 last:border-r-0"
              >
                <div className="text-xs font-semibold text-gray-600 dark:text-gray-400">{month}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-gray-700" />

        {/* Strategy rows with initiatives */}
        {visibleStrategies.map(strategy => {
          const strategyInitiatives = initiativesByStrategy[strategy.id] || [];

          return (
            <div key={strategy.id} className="flex border-b border-gray-100 dark:border-gray-700 last:border-b-0">
              {/* Strategy label */}
              <div className="w-48 flex-shrink-0 px-4 py-4 border-r border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {strategy.name}
                  </div>
                </div>
              </div>

              {/* Timeline container */}
              <div className="flex flex-1 relative min-h-20">
                {months.map((_, idx) => (
                  <div
                    key={idx}
                    className="flex-1 border-r border-gray-100 dark:border-gray-700 last:border-r-0 relative"
                  />
                ))}

                {/* Today marker */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 opacity-60"
                  style={{ left: `${todayPercent}%` }}
                />

                {/* Initiative bars */}
                {strategyInitiatives.map((initiative, idx) => {
                  const leftPercent = getPositionPercent(initiative.startDate, currentYear);
                  const widthPercent = getWidthPercent(
                    initiative.startDate,
                    initiative.endDate,
                    currentYear
                  );
                  const pillar = getPillarForInitiative(initiative.clientPillarId);

                  return (
                    <div
                      key={initiative.id}
                      className="absolute rounded px-2 py-1 flex items-center justify-center text-center border border-gray-300 dark:border-gray-600 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                      style={{
                        left: `calc(${leftPercent}% + 0.5rem)`,
                        width: `calc(${widthPercent}% - 1rem)`,
                        top: `${8 + idx * 18}px`,
                        backgroundColor: '#E0E7FF',
                        color: '#1F2937',
                      }}
                      title={`${initiative.name} (${initiative.startDate} to ${initiative.endDate})`}
                    >
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="text-[10px] font-semibold truncate group-hover:text-[#3B5BDB]">
                          {initiative.name}
                        </span>
                        {pillar && (
                          <span
                            className="text-[9px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 text-white"
                            style={{ backgroundColor: pillar.color }}
                            title={pillar.name}
                          >
                            {pillar.name.substring(0, 3).toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* "Other" row for unlinked initiatives */}
        {hasUnlinkedInitiatives && (
          <div className="flex border-b border-gray-100 dark:border-gray-700 last:border-b-0">
            {/* "Other" label */}
            <div className="w-48 flex-shrink-0 px-4 py-4 border-r border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
              <div className="text-sm font-semibold text-gray-900 dark:text-white">Other Initiatives</div>
            </div>

            {/* Timeline container */}
            <div className="flex flex-1 relative min-h-20">
              {months.map((_, idx) => (
                <div
                  key={idx}
                  className="flex-1 border-r border-gray-100 dark:border-gray-700 last:border-r-0 relative"
                />
              ))}

              {/* Today marker */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 opacity-60"
                style={{ left: `${todayPercent}%` }}
              />

              {/* Unlinked initiative bars */}
              {(initiativesByStrategy['unlinked'] || []).map((initiative, idx) => {
                const leftPercent = getPositionPercent(initiative.startDate, currentYear);
                const widthPercent = getWidthPercent(
                  initiative.startDate,
                  initiative.endDate,
                  currentYear
                );
                const pillar = getPillarForInitiative(initiative.clientPillarId);

                return (
                  <div
                    key={initiative.id}
                    className="absolute rounded px-2 py-1 flex items-center justify-center text-center border border-gray-400 dark:border-gray-500 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                    style={{
                      left: `calc(${leftPercent}% + 0.5rem)`,
                      width: `calc(${widthPercent}% - 1rem)`,
                      top: `${8 + idx * 18}px`,
                      backgroundColor: '#F3F4F6',
                      color: '#4B5563',
                    }}
                    title={`${initiative.name} (${initiative.startDate} to ${initiative.endDate})`}
                  >
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="text-[10px] font-semibold truncate group-hover:text-[#3B5BDB]">
                        {initiative.name}
                      </span>
                      {pillar && (
                        <span
                          className="text-[9px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 text-white"
                          style={{ backgroundColor: pillar.color }}
                          title={pillar.name}
                        >
                          {pillar.name.substring(0, 3).toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
