import { useEffect, useRef, useState } from 'react';

export interface TeamMember {
  id: string;
  name: string;
  initials: string;
  color: string;
}

interface MentionDropdownProps {
  isOpen: boolean;
  searchText: string;
  teamMembers: TeamMember[];
  onSelectMember: (member: TeamMember) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

export function MentionDropdown({
  isOpen,
  searchText,
  teamMembers,
  onSelectMember,
  textareaRef,
}: MentionDropdownProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // Filter members by search text
  const filtered = teamMembers.filter(m =>
    m.name.toLowerCase().includes(searchText.toLowerCase())
  );

  // Reset selection when filtered list changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [filtered.length]);

  // Calculate position based on textarea cursor
  useEffect(() => {
    if (!isOpen || !textareaRef.current || !dropdownRef.current) return;

    const textarea = textareaRef.current;
    const rect = textarea.getBoundingClientRect();
    
    // Position dropdown below textarea
    setPosition({
      top: rect.bottom + 8,
      left: rect.left,
    });
  }, [isOpen, textareaRef]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen || filtered.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filtered.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filtered.length) % filtered.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          onSelectMember(filtered[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        // Escape is handled by parent component
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onSelectMember]);

  if (!isOpen || filtered.length === 0) return null;

  return (
    <div
      ref={dropdownRef}
      className="fixed z-50 w-64 rounded-lg shadow-lg bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700 py-1"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        maxHeight: '300px',
        overflowY: 'auto',
      }}
    >
      {filtered.map((member, idx) => (
        <button
          key={member.id}
          onClick={() => onSelectMember(member)}
          onMouseEnter={() => setSelectedIndex(idx)}
          className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
            idx === selectedIndex
              ? 'bg-indigo-50 dark:bg-indigo-900'
              : 'hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          <span
            className="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium text-white flex-shrink-0"
            style={{ backgroundColor: member.color }}
          >
            {member.initials}
          </span>
          <span className="text-gray-900 dark:text-white truncate">{member.name}</span>
        </button>
      ))}
    </div>
  );
}
