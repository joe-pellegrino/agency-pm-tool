'use client';

import { useState, useTransition } from 'react';
import { Loader2, Plus, Edit2, Trash2, Pause, Play } from 'lucide-react';
import { toast } from 'sonner';
import type { ClientService, Service, Strategy } from '@/lib/data';
import { useAppData } from '@/lib/contexts/AppDataContext';
import { upsertClientService, removeClientService } from '@/lib/actions';
import { formatDate } from '@/lib/utils';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

interface ServicesTabProps {
  clientId: string;
  clientName: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  active: { label: 'Active', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  paused: { label: 'Paused', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  cancelled: { label: 'Not Active', color: 'bg-gray-100 text-gray-500', dot: 'bg-gray-300' },
  planning: { label: 'Planning', color: 'bg-blue-100 text-blue-600', dot: 'bg-blue-400' },
};

function QuickAssignServiceModal({
  service,
  clientName,
  clientId,
  existingCs,
  onClose,
}: {
  service: Service;
  clientName: string;
  clientId: string;
  existingCs?: ClientService;
  onClose: () => void;
}) {
  const { STRATEGIES = [], refresh } = useAppData();
  const clientStrategies = STRATEGIES.filter(s => s.clientId === clientId);
  const [status, setStatus] = useState<ClientService['status']>(existingCs?.status || 'active');
  const [startDate, setStartDate] = useState(existingCs?.startDate || new Date().toISOString().split('T')[0]);
  const [cadence, setCadence] = useState(existingCs?.monthlyCadence || '');
  const [strategyId, setStrategyId] = useState(existingCs?.linkedStrategyId || '');
  const [isPending, startTransition] = useTransition();

  const inputClass = 'w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3B5BDB]';

  const handleConfirm = () => {
    startTransition(async () => {
      try {
        await upsertClientService({
          clientId,
          serviceId: service.id,
          status,
          startDate,
          monthlyCadence: cadence || undefined,
          linkedStrategyId: strategyId || undefined,
        });
        toast.success(`${service.name} ${existingCs ? 'updated' : 'assigned'}`);
        refresh?.();
        onClose();
      } catch (err) {
        toast.error('Failed: ' + (err as Error).message);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white text-base">
            {existingCs ? 'Edit Service' : 'Assign Service'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">{service.name}</p>
        </div>

        <form onSubmit={e => { e.preventDefault(); handleConfirm(); }} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as ClientService['status'])}
              className={inputClass}
            >
              <option value="active">Active</option>
              <option value="planning">Planning</option>
              <option value="paused">Paused</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Cadence / Notes</label>
            <textarea
              value={cadence}
              onChange={e => setCadence(e.target.value)}
              placeholder="e.g. 'Monthly Meta Ads management + creative'"
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Linked Strategy</label>
            <select
              value={strategyId}
              onChange={e => setStrategyId(e.target.value)}
              className={inputClass}
            >
              <option value="">— None —</option>
              {clientStrategies.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#3B5BDB] hover:bg-[#3B5BDB] disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {isPending && <Loader2 size={14} className="animate-spin" />}
              {existingCs ? 'Update' : 'Assign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ServiceCard({
  service,
  clientService,
  strategy,
  clientId,
  clientName,
  onEdit,
  onRemove,
}: {
  service: Service;
  clientService: ClientService;
  strategy?: Strategy;
  clientId: string;
  clientName: string;
  onEdit: (cs: ClientService) => void;
  onRemove: (csId: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleStatusToggle = (newStatus: ClientService['status']) => {
    startTransition(async () => {
      try {
        await upsertClientService({
          clientId,
          serviceId: service.id,
          status: newStatus,
          startDate: clientService.startDate,
          monthlyCadence: clientService.monthlyCadence,
          linkedStrategyId: clientService.linkedStrategyId,
        });
        toast.success(`Status updated to ${newStatus}`);
      } catch (err) {
        toast.error('Failed: ' + (err as Error).message);
      }
    });
  };

  const handleRemove = () => {
    startTransition(async () => {
      try {
        await removeClientService(clientService.id);
        toast.success(`${service.name} removed`);
        onRemove(clientService.id);
      } catch (err) {
        toast.error('Failed: ' + (err as Error).message);
      }
    });
  };

  const statusConfig = STATUS_CONFIG[clientService.status];

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
        <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{service.name}</h3>
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{service.category}</p>
            </div>
            <span className={`text-[10px] font-medium px-2 py-1 rounded-full flex-shrink-0 flex items-center gap-1 ${statusConfig.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
              {statusConfig.label}
            </span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{service.description}</p>
        </div>

        <div className="px-4 py-3 space-y-2 bg-gray-50 dark:bg-gray-700/30">
          {/* Start Date */}
          {clientService.startDate && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600 dark:text-gray-400">Started</span>
              <span className="text-gray-900 dark:text-white font-medium">{formatDate(clientService.startDate)}</span>
            </div>
          )}

          {/* Cadence */}
          {clientService.monthlyCadence && (
            <div className="text-xs text-gray-600 dark:text-gray-400 pt-1">
              <span className="font-medium text-gray-700 dark:text-gray-300">Cadence:</span> {clientService.monthlyCadence}
            </div>
          )}

          {/* Linked Strategy */}
          {strategy && (
            <div className="text-xs pt-1">
              <span className="font-medium text-gray-700 dark:text-gray-300">Strategy:</span>{' '}
              <span className="text-gray-600 dark:text-gray-400">{strategy.name}</span>
            </div>
          )}

          {/* Linked Projects Count */}
          {clientService.linkedProjects.length > 0 && (
            <div className="text-xs text-gray-600 dark:text-gray-400 pt-1">
              <span className="font-medium text-gray-700 dark:text-gray-300">{clientService.linkedProjects.length}</span> linked {clientService.linkedProjects.length === 1 ? 'project' : 'projects'}
            </div>
          )}
        </div>

        <div className="px-4 py-3 flex items-center gap-2 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
          {clientService.status === 'active' ? (
            <button
              onClick={() => handleStatusToggle('paused')}
              disabled={isPending}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors disabled:opacity-50"
              title="Pause service"
            >
              <Pause size={12} />
              Pause
            </button>
          ) : clientService.status === 'paused' ? (
            <button
              onClick={() => handleStatusToggle('active')}
              disabled={isPending}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded border border-green-200 dark:border-green-900 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors disabled:opacity-50"
              title="Resume service"
            >
              <Play size={12} />
              Resume
            </button>
          ) : (
            <button
              onClick={() => handleStatusToggle('active')}
              disabled={isPending}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded border border-green-200 dark:border-green-900 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors disabled:opacity-50"
              title="Activate service"
            >
              <Play size={12} />
              Activate
            </button>
          )}

          <button
            onClick={() => onEdit(clientService)}
            disabled={isPending}
            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            title="Edit service"
          >
            <Edit2 size={12} />
            Edit
          </button>

          <button
            onClick={() => setShowConfirm(true)}
            disabled={isPending}
            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
            title="Remove service"
          >
            <Trash2 size={12} />
            Remove
          </button>
        </div>
      </div>

      {showConfirm && (
        <ConfirmDialog
          title="Remove Service"
          message={`Are you sure you want to remove ${service.name} from ${clientName}?`}
          confirmLabel="Remove"
          onConfirm={() => {
            handleRemove();
            setShowConfirm(false);
          }}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
}

export default function ServicesTab({ clientId, clientName }: ServicesTabProps) {
  const { SERVICES = [], CLIENT_SERVICES = [], STRATEGIES = [] } = useAppData();
  const [editingService, setEditingService] = useState<ClientService | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  // Get services assigned to this client
  const clientServices = CLIENT_SERVICES.filter(cs => cs.clientId === clientId);
  const assignedServiceIds = new Set(clientServices.map(cs => cs.serviceId));

  // Get available services not yet assigned
  const availableServices = SERVICES.filter(s => !assignedServiceIds.has(s.id));

  // Group services by status
  const activeServices = clientServices.filter(cs => cs.status === 'active');
  const planningServices = clientServices.filter(cs => cs.status === 'planning');
  const pausedServices = clientServices.filter(cs => cs.status === 'paused');
  const inactiveServices = clientServices.filter(cs => cs.status === 'cancelled');

  const getStrategyForService = (serviceId: string): Strategy | undefined => {
    const cs = clientServices.find(c => c.serviceId === serviceId);
    if (!cs?.linkedStrategyId) return undefined;
    return STRATEGIES.find(s => s.id === cs.linkedStrategyId);
  };

  const getService = (serviceId: string): Service | undefined => {
    return SERVICES.find(s => s.id === serviceId);
  };

  const handleRemoveService = () => {
    // This will be handled by the card component
  };

  return (
    <div className="space-y-6">
      {/* Assign New Service */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-4">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 text-sm mb-3">Assign New Service</h3>
        {availableServices.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {availableServices.map(service => (
              <button
                key={service.id}
                onClick={() => setSelectedService(service)}
                className="flex items-center gap-2 text-left px-3 py-2 rounded-lg border border-blue-300 dark:border-blue-700 bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors text-sm font-medium"
              >
                <Plus size={14} />
                {service.name}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-blue-700 dark:text-blue-300">All services are already assigned!</p>
        )}
      </div>

      {/* Active Services */}
      {activeServices.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Active Services ({activeServices.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeServices.map(cs => {
              const service = getService(cs.serviceId);
              const strategy = getStrategyForService(cs.serviceId);
              return service ? (
                <ServiceCard
                  key={cs.id}
                  service={service}
                  clientService={cs}
                  strategy={strategy}
                  clientId={clientId}
                  clientName={clientName}
                  onEdit={setEditingService}
                  onRemove={handleRemoveService}
                />
              ) : null;
            })}
          </div>
        </div>
      )}

      {/* Planning Services */}
      {planningServices.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Planning ({planningServices.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {planningServices.map(cs => {
              const service = getService(cs.serviceId);
              const strategy = getStrategyForService(cs.serviceId);
              return service ? (
                <ServiceCard
                  key={cs.id}
                  service={service}
                  clientService={cs}
                  strategy={strategy}
                  clientId={clientId}
                  clientName={clientName}
                  onEdit={setEditingService}
                  onRemove={handleRemoveService}
                />
              ) : null;
            })}
          </div>
        </div>
      )}

      {/* Paused Services */}
      {pausedServices.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Paused ({pausedServices.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pausedServices.map(cs => {
              const service = getService(cs.serviceId);
              const strategy = getStrategyForService(cs.serviceId);
              return service ? (
                <ServiceCard
                  key={cs.id}
                  service={service}
                  clientService={cs}
                  strategy={strategy}
                  clientId={clientId}
                  clientName={clientName}
                  onEdit={setEditingService}
                  onRemove={handleRemoveService}
                />
              ) : null;
            })}
          </div>
        </div>
      )}

      {/* Inactive Services */}
      {inactiveServices.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gray-400" />
            Not Active ({inactiveServices.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inactiveServices.map(cs => {
              const service = getService(cs.serviceId);
              const strategy = getStrategyForService(cs.serviceId);
              return service ? (
                <ServiceCard
                  key={cs.id}
                  service={service}
                  clientService={cs}
                  strategy={strategy}
                  clientId={clientId}
                  clientName={clientName}
                  onEdit={setEditingService}
                  onRemove={handleRemoveService}
                />
              ) : null;
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {clientServices.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 text-sm">No services assigned yet. Assign one above to get started.</p>
        </div>
      )}

      {/* Modals */}
      {selectedService && (
        <QuickAssignServiceModal
          service={selectedService}
          clientName={clientName}
          clientId={clientId}
          onClose={() => setSelectedService(null)}
        />
      )}

      {editingService && (
        <QuickAssignServiceModal
          service={getService(editingService.serviceId)!}
          clientName={clientName}
          clientId={clientId}
          existingCs={editingService}
          onClose={() => setEditingService(null)}
        />
      )}
    </div>
  );
}
