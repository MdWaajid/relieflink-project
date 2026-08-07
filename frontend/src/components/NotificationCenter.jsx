import React from 'react';
import { X, Check, AlertTriangle, CheckCircle2, Info, Truck } from 'lucide-react';

export default function NotificationCenter({ isOpen, onClose, notifications, onMarkRead, onMarkAllRead }) {
  if (!isOpen) return null;

  const hasUnread = notifications.some(n => !n.is_read);

  const getIcon = (type) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-5 h-5 text-rose-600" />;
      case 'match': return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case 'dispatch': return <Truck className="w-5 h-5 text-cyan-600" />;
      default: return <Info className="w-5 h-5 text-indigo-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/30 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white/95 backdrop-blur-md border-l border-slate-200/80 h-full flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold text-slate-900">Live Notification Feed</h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              District Command Alerts
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {hasUnread && (
              <button
                onClick={onMarkAllRead}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
              >
                Mark all read
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-slate-500 font-medium">
              No notifications yet.
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  n.is_read
                    ? 'bg-slate-50/50 border-slate-200/60 text-slate-500'
                    : 'bg-white border-slate-200 text-slate-900 shadow-xs'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="mt-0.5 shrink-0">{getIcon(n.type)}</div>
                  <div className="flex-1 text-xs sm:text-sm font-medium">
                    <p className="leading-relaxed text-slate-800">{n.message}</p>
                    <span className="text-[11px] text-slate-400 mt-1 block font-normal">
                      {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {!n.is_read && (
                    <button
                      onClick={() => onMarkRead(n.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
