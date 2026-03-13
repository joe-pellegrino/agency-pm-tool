'use client';

import { useState } from 'react';
import { Document, Comment } from '@/lib/data';
import { useAppData } from '@/lib/contexts/AppDataContext';
import {
  FileText, MessageSquare, Clock, Users, ChevronRight, ChevronDown,
  Send, CornerDownRight, History, ArrowLeft
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

function Avatar({ id, size = 24 }: { id: string; size?: number }) {
  const { TEAM_MEMBERS = [] } = useAppData();
  const m = TEAM_MEMBERS.find(m => m.id === id);
  if (!m) return null;
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.38, backgroundColor: m.color }}
      title={m.name}
    >
      {m.initials}
    </div>
  );
}

function CommentThread({ comment, depth = 0 }: { comment: Comment; depth?: number }) {
  const { TEAM_MEMBERS = [] } = useAppData();
  const author = TEAM_MEMBERS.find(m => m.id === comment.authorId)!;
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [localReplies, setLocalReplies] = useState(comment.replies || []);

  function submitReply() {
    if (!replyText.trim()) return;
    setLocalReplies(prev => [...prev, {
      id: Math.random().toString(),
      authorId: 'joe',
      text: replyText,
      createdAt: new Date().toISOString(),
    }]);
    setReplyText('');
    setShowReply(false);
  }

  return (
    <div className={depth > 0 ? 'ml-8 mt-3' : ''}>
      <div className="flex gap-2.5">
        <Avatar id={comment.authorId} size={28} />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">{author.name}</span>
            <span className="text-xs text-gray-400">{format(parseISO(comment.createdAt), 'MMM d, h:mm a')}</span>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2.5">
            {comment.text}
          </p>
          {depth === 0 && (
            <button
              onClick={() => setShowReply(!showReply)}
              className="mt-1.5 flex items-center gap-1 text-xs text-gray-400 hover:text-indigo-600 transition-colors"
            >
              <CornerDownRight size={10} />
              Reply
            </button>
          )}
        </div>
      </div>

      {/* Replies */}
      {localReplies.map(reply => (
        <CommentThread key={reply.id} comment={reply} depth={depth + 1} />
      ))}

      {/* Reply input */}
      {showReply && (
        <div className="ml-8 mt-2 flex gap-2">
          <Avatar id="joe" size={24} />
          <div className="flex-1 flex gap-2">
            <input
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitReply()}
              placeholder="Write a reply..."
              className="flex-1 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button onClick={submitReply} className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              <Send size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DocumentEditor({ doc, onBack }: { doc: Document; onBack: () => void }) {
  const { CLIENTS = [], TEAM_MEMBERS = [] } = useAppData();
  const [activeTab, setActiveTab] = useState<'comments' | 'history'>('comments');
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState(doc.comments);
  const [activeVersion, setActiveVersion] = useState(doc.versions[0]);
  const client = CLIENTS.find(c => c.id === doc.clientId);

  function submitComment() {
    if (!newComment.trim()) return;
    setComments(prev => [...prev, {
      id: Math.random().toString(),
      authorId: 'joe',
      text: newComment,
      createdAt: new Date().toISOString(),
      replies: [],
    }]);
    setNewComment('');
  }

  // Render markdown-like content
  function renderContent(content: string) {
    const html = content
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>(\n)?)+/g, (m) => `<ul>${m}</ul>`)
      .replace(/^---$/gm, '<hr>')
      .replace(/\[x\]/g, '✅').replace(/\[ \]/g, '☐')
      .replace(/\| (.+) \|/g, (m, inner) => {
        const cells = inner.split(' | ');
        return '<tr>' + cells.map((c: string) => `<td>${c}</td>`).join('') + '</tr>';
      })
      .replace(/(<tr>.*<\/tr>(\n)?)+/g, (m) => `<table>${m}</table>`)
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(?!<[hultpr])/gm, '');
    return `<div class="prose-content">${html}</div>`;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Doc header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-3 transition-colors"
          >
            <ArrowLeft size={14} /> Back to documents
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{doc.title}</h1>
          <div className="flex items-center gap-3 flex-wrap">
            {client && (
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ backgroundColor: client.color + '18', color: client.color }}
              >
                {client.name}
              </span>
            )}
            {doc.clientId === 'all' && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">
                All Clients
              </span>
            )}
            <span className="text-xs text-gray-400">
              Updated {format(parseISO(doc.updatedAt), 'MMM d, yyyy')}
            </span>
          </div>
        </div>

        {/* Collaborators */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Collaborators</span>
          <div className="flex -space-x-1.5">
            {doc.collaborators.map(id => (
              <Avatar key={id} id={id} size={28} />
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1">
        {/* Editor */}
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 min-w-0">
              <FileText size={14} className="text-indigo-500 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{doc.title}</span>
            </div>
            <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full whitespace-nowrap ml-2">
              {activeVersion.version} — preview
            </span>
          </div>
          <div
            className="p-4 sm:p-8 overflow-y-auto max-h-[60vh] lg:max-h-[75vh]"
            dangerouslySetInnerHTML={{ __html: renderContent(doc.content) }}
          />
        </div>

        {/* Sidebar — full width on mobile, fixed width on lg+ */}
        <div className="w-full lg:w-80 flex flex-col gap-0">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col flex-1">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveTab('comments')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-colors ${
                  activeTab === 'comments'
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
              >
                <MessageSquare size={13} />
                Comments ({comments.length})
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-colors ${
                  activeTab === 'history'
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
              >
                <History size={13} />
                Versions ({doc.versions.length})
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === 'comments' ? (
                <div className="space-y-5">
                  {comments.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-6">No comments yet.</p>
                  )}
                  {comments.map(c => (
                    <CommentThread key={c.id} comment={c} />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {doc.versions.map(v => {
                    const author = TEAM_MEMBERS.find(m => m.id === v.authorId)!;
                    const isActive = v.id === activeVersion.id;
                    return (
                      <button
                        key={v.id}
                        onClick={() => setActiveVersion(v)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          isActive
                            ? 'border-indigo-200 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-700'
                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs font-bold ${isActive ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-200'}`}>
                            {v.version}
                          </span>
                          {isActive && <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.5 rounded-full">Current</span>}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">{v.summary}</p>
                        <div className="flex items-center gap-1.5">
                          <Avatar id={v.authorId} size={16} />
                          <span className="text-[11px] text-gray-400">{author.name.split(' ')[0]}</span>
                          <span className="text-[11px] text-gray-400">· {format(parseISO(v.createdAt), 'MMM d')}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Comment input */}
            {activeTab === 'comments' && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-2">
                  <Avatar id="joe" size={28} />
                  <div className="flex-1">
                    <textarea
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      rows={2}
                      className="w-full text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                    <button
                      onClick={submitComment}
                      className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      <Send size={11} /> Post comment
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DocumentViewer() {
  const { DOCUMENTS = [], TEAM_MEMBERS = [], CLIENTS = [] } = useAppData();
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  if (selectedDoc) {
    return <DocumentEditor doc={selectedDoc} onBack={() => setSelectedDoc(null)} />;
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {DOCUMENTS.map(doc => {
          const client = CLIENTS.find(c => c.id === doc.clientId);
          const latestVersion = doc.versions[0];
          const latestAuthor = TEAM_MEMBERS.find(m => m.id === latestVersion.authorId);

          return (
            <button
              key={doc.id}
              onClick={() => setSelectedDoc(doc)}
              className="text-left bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-700 transition-all group"
            >
              {/* Icon + version */}
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                  <FileText size={18} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                  {latestVersion.version}
                </span>
              </div>

              {/* Title */}
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {doc.title}
              </h3>

              {/* Client badge */}
              {client ? (
                <span
                  className="inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-3"
                  style={{ backgroundColor: client.color + '18', color: client.color }}
                >
                  {client.name}
                </span>
              ) : (
                <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full mb-3 bg-indigo-50 text-indigo-600">
                  All Clients
                </span>
              )}

              {/* Meta */}
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <MessageSquare size={11} />
                  {doc.comments.length} comments
                </span>
                <span className="flex items-center gap-1">
                  <History size={11} />
                  {doc.versions.length} versions
                </span>
              </div>

              {/* Collaborators */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <div className="flex -space-x-1.5">
                  {doc.collaborators.map(id => (
                    <Avatar key={id} id={id} size={22} />
                  ))}
                </div>
                <span className="text-xs text-gray-400">
                  Updated {format(parseISO(doc.updatedAt), 'MMM d')}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
