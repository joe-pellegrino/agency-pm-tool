/**
 * Custom CollaborationCursor extension that uses @tiptap/y-tiptap's yCursorPlugin
 * instead of y-prosemirror's. This is required because @tiptap/extension-collaboration
 * v3.20+ uses @tiptap/y-tiptap's ySyncPlugin (with its own ySyncPluginKey), while the
 * official @tiptap/extension-collaboration-cursor@3.0.0 still uses y-prosemirror's
 * yCursorPlugin which looks up state via y-prosemirror's ySyncPluginKey — incompatible.
 */
import { Extension } from '@tiptap/core';
import { yCursorPlugin, defaultCursorBuilder } from '@tiptap/y-tiptap';
import type { Awareness } from 'y-protocols/awareness';

export interface CustomCollaborationCursorOptions {
  provider: { awareness: Awareness } | null;
  user: { name: string | null; color: string | null } | null;
  render?: (user: { name: string; color: string }) => HTMLElement;
}

const CustomCollaborationCursor = Extension.create<CustomCollaborationCursorOptions>({
  name: 'collaborationCursor',

  addOptions() {
    return {
      provider: null,
      user: { name: null, color: null },
      render: defaultCursorBuilder,
    };
  },

  addStorage() {
    return {
      users: [],
    };
  },

  addProseMirrorPlugins() {
    if (!this.options.provider?.awareness) {
      return [];
    }

    const awareness = this.options.provider.awareness;

    if (this.options.user) {
      awareness.setLocalStateField('user', this.options.user);
    }

    return [
      yCursorPlugin(awareness, {
        cursorBuilder: this.options.render || defaultCursorBuilder,
      }),
    ];
  },
});

export default CustomCollaborationCursor;
