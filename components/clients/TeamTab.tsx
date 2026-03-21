'use client';

import { useEffect, useState, useTransition } from 'react';
import { useAppData } from '@/lib/contexts/AppDataContext';
import { toast } from 'sonner';
import {
  Plus, Trash2, Loader2, Star, X,
} from 'lucide-react';
import { Dialog, DialogPanel, DialogBackdrop } from '@headlessui/react';
import {
  getClientTeamAssignments,
  addClientTeamAssignment,
  updateClientTeamAssignment,
  removeClientTeamAssignment,
} from '@/lib/actions-client-settings';

interface ClientTeamAssignment {
  id: string;
  client_id: string;
  team_member_id: string;
  teamMemberId: string;
  role: string;
  is_primary: boolean;
  isPrimary: boolean;
  created_at: string;
}

const ROLE_OPTIONS = ['Account Manager', 'Designer', 'Strategist', 'Developer', 'Other'] as const;

interface TeamTabProps {
  clientId: string;
}

export default function TeamTab({ clientId }: TeamTabProps) {
  const { TEAM_MEMBERS = [] } = useAppData();
  const [assignments, setAssignments] = useState<ClientTeamAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Load assignments on mount
  useEffect(() => {
    const load = async () => {
      try {
        const data = await getClientTeamAssignments(clientId);
        setAssignments(data);
      } catch (err) {
        toast.error('Failed to load team assignments');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [clientId]);

  const handleAddMember = async (teamMemberId: string, role: string, isPrimary: boolean) => {
    startTransition(async () => {
      try {
        const result = await addClientTeamAssignment({
          clientId,
          teamMemberId,
          role: role as any,
          isPrimary,
        });
        setAssignments(prev => [...prev, result]);
        setShowModal(false);
        toast.success('Team member added');
      } catch (err) {
        toast.error('Failed to add team member: ' + (err as Error).message);
      }
    });
  };

  const handleRemoveMember = async (id: string) => {
    if (!window.confirm('Remove this team member?')) return;

    startTransition(async () => {
      try {
        await removeClientTeamAssignment(id);
        setAssignments(prev => prev.filter(a => a.id !== id));
        toast.success('Team member removed');
      } catch (err) {
        toast.error('Failed to remove team member: ' + (err as Error).message);
      }
    });
  };

  const handleTogglePrimary = async (id: string) => {
    const assignment = assignments.find(a => a.id === id);
    if (!assignment) return;

    startTransition(async () => {
      try {
        const result = await updateClientTeamAssignment(id, {
          isPrimary: !assignment.isPrimary,
        });
        setAssignments(prev => prev.map(a => a.id === id ? result : { ...a, isPrimary: false }));
        toast.success(result.isPrimary ? 'Primary contact set' : 'Primary contact removed');
      } catch (err) {
        toast.error('Failed to update assignment: ' + (err as Error).message);
      }
    });
  };

  const handleChangeRole = async (id: string, newRole: string) => {
    startTransition(async () => {
      try {
        const result = await updateClientTeamAssignment(id, {
          role: newRole as any,
        });
        setAssignments(prev => prev.map(a => a.id === id ? result : a));
        toast.success('Role updated');
      } catch (err) {
        toast.error('Failed to update role: ' + (err as Error).message);
      }
    });
  };

  // Get team member info by ID
  const getMember = (id: string) => TEAM_MEMBERS.find(m => m.id === id);

  // Get already-assigned member IDs
  const assignedIds = assignments.map(a => a.teamMemberId);
  const availableMembers = TEAM_MEMBERS.filter(m => !assignedIds.includes(m.id));

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading team assignments...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Team Members</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage which team members are assigned to this client
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          disabled={isPending || availableMembers.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-[#3B5BDB] hover:bg-[#3B5BDB]/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Add Member
        </button>
      </div>

      {/* Team Members List */}
      {assignments.length === 0 ? (
        <div className="py-12 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
          <Users size={32} className="mx-auto text-gray-400 mb-2" />
          <p className="text-gray-600 dark:text-gray-400">No team members assigned yet</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
            Add team members to get started
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((assignment) => {
            const member = getMember(assignment.teamMemberId);
            if (!member) return null;

            return (
              <div
                key={assignment.id}
                className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {/* Avatar */}
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                  style={{ backgroundColor: member.color }}
                >
                  {member.initials}
                </div>

                {/* Name & Role */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 dark:text-white">{member.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{member.role}</div>
                </div>

                {/* Role Dropdown */}
                <select
                  value={assignment.role}
                  onChange={(e) => handleChangeRole(assignment.id, e.target.value)}
                  disabled={isPending}
                  className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 transition-colors"
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>

                {/* Primary Contact Toggle */}
                <button
                  onClick={() => handleTogglePrimary(assignment.id)}
                  disabled={isPending}
                  className={`flex items-center justify-center w-9 h-9 rounded-md transition-colors ${
                    assignment.isPrimary
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
                  } disabled:opacity-50`}
                  title={assignment.isPrimary ? 'Primary contact' : 'Set as primary'}
                >
                  <Star size={16} fill={assignment.isPrimary ? 'currentColor' : 'none'} />
                </button>

                {/* Remove Button */}
                <button
                  onClick={() => handleRemoveMember(assignment.id)}
                  disabled={isPending}
                  className="flex items-center justify-center w-9 h-9 rounded-md bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50"
                  title="Remove member"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Member Modal */}
      {showModal && <AddMemberModal
        availableMembers={availableMembers}
        onAdd={handleAddMember}
        onClose={() => setShowModal(false)}
        isPending={isPending}
      />}
    </div>
  );
}

// ─── Add Member Modal ────────────────────────────────────────────────────────

interface AddMemberModalProps {
  availableMembers: any[];
  onAdd: (teamMemberId: string, role: string, isPrimary: boolean) => void;
  onClose: () => void;
  isPending: boolean;
}

function AddMemberModal({ availableMembers, onAdd, onClose, isPending }: AddMemberModalProps) {
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('Account Manager');
  const [isPrimary, setIsPrimary] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) {
      toast.error('Please select a team member');
      return;
    }
    onAdd(selectedMemberId, selectedRole, isPrimary);
    setSelectedMemberId('');
    setSelectedRole('Account Manager');
    setIsPrimary(false);
  };

  return (
    <Dialog open={true} onClose={onClose} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-gray-500/75 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
      />

      <div className="fixed inset-0 flex items-center justify-center overflow-y-auto">
        <DialogPanel
          transition
          className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-900 text-left shadow-xl transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full sm:max-w-md data-closed:sm:translate-y-0 data-closed:sm:scale-95"
        >
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-white text-lg">
              Add Team Member
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            {/* Member Selection */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                Team Member *
              </label>
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                disabled={isPending}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3B5BDB] disabled:opacity-50"
                autoFocus
              >
                <option value="">Select a team member...</option>
                {availableMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} ({member.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                Role on this Client
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                disabled={isPending}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3B5BDB] disabled:opacity-50"
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            {/* Primary Contact Toggle */}
            <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <input
                type="checkbox"
                id="isPrimary"
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
                disabled={isPending}
                className="w-4 h-4 rounded cursor-pointer"
              />
              <label htmlFor="isPrimary" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer flex-1">
                Mark as primary contact for this client
              </label>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending || !selectedMemberId}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#3B5BDB] hover:bg-[#3B5BDB]/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
              >
                {isPending && <Loader2 size={14} className="animate-spin" />}
                Add Member
              </button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

// ─── Custom Users Icon ────────────────────────────────────────────────────────

function Users({ size, className }: { size?: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size || 24}
      height={size || 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
