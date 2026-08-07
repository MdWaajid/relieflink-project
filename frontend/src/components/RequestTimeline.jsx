import React from 'react';
import { Clock, CheckCircle2, AlertTriangle, Truck, Sparkles, UserCheck } from 'lucide-react';

export default function RequestTimeline({ events = [], title = "System Audit Trail & Event History" }) {
  const getEventIcon = (type) => {
    switch (type) {
      case 'critical':
      case 'override':
        return <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />;
      case 'matched':
        return <Sparkles className="w-3.5 h-3.5 text-indigo-600" />;
      case 'dispatched':
        return <Truck className="w-3.5 h-3.5 text-cyan-600" />;
      case 'delivered':
      case 'fulfilled':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  const getDotStyle = (type) => {
    switch (type) {
      case 'critical':
      case 'override':
        return 'bg-rose-600 ring-4 ring-rose-50';
      case 'matched':
        return 'bg-indigo-600 ring-4 ring-indigo-50';
      case 'dispatched':
        return 'bg-cyan-600 ring-4 ring-cyan-50';
      case 'delivered':
      case 'fulfilled':
        return 'bg-emerald-600 ring-4 ring-emerald-50';
      default:
        return 'bg-slate-600 ring-4 ring-slate-100';
    }
  };

  // Sample fallback events if none provided
  const displayEvents = events.length > 0 ? events : [
    {
      id: 1,
      title: 'Relief Request Submitted',
      description: 'Camp #1 requested 1,000L Drinking Water for 250 affected individuals.',
      meta: 'Today at 09:30 AM · Central Flood Shelter',
      type: 'created'
    },
    {
      id: 2,
      title: 'Smart Engine Priority Evaluated: Critical',
      description: 'System automatically flagged request as Critical Priority based on resource type (Water) and high population count.',
      meta: 'Today at 09:31 AM · Matching Engine v1.1',
      type: 'critical'
    },
    {
      id: 3,
      title: 'NGO Resource Matched (Match Score: 92% RMS)',
      description: 'Red Cross Emergency Relief NGO (Base: ~8.4km) matched with full stock coverage.',
      meta: 'Today at 09:35 AM · NGO Partner Assigned',
      type: 'matched'
    },
    {
      id: 4,
      title: 'Supply Logistics Dispatched',
      description: 'NGO Coordinator marked water supply truck in transit to Central Flood Shelter.',
      meta: 'Today at 10:15 AM · Vehicle ID: TN-01-RL-402',
      type: 'dispatched'
    },
    {
      id: 5,
      title: 'Relief Supplies Delivered & Stock Decremented',
      description: '1,000L Drinking Water delivered and verified by Camp Manager.',
      meta: 'Today at 11:05 AM · Status: Fulfilled',
      type: 'delivered'
    }
  ];

  return (
    <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
      
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            {title}
          </h3>
          <p className="text-xs font-medium text-slate-500 mt-0.5">
            Connected timeline of resource requests, priority score updates & delivery logs
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200/80">
          {displayEvents.length} Events Logged
        </span>
      </div>

      {/* Connected Vertical Timeline */}
      <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-indigo-100 ml-2">
        {displayEvents.map((evt) => (
          <div key={evt.id} className="relative group">
            {/* Dot Indicator */}
            <div className={`absolute -left-[30px] top-1 w-3 h-3 rounded-full ${getDotStyle(evt.type)} transition-all duration-200 group-hover:scale-125`} />

            <div className="bg-white/60 backdrop-blur-xs border border-slate-200/60 rounded-xl p-4 transition-all hover:bg-white hover:border-slate-300 hover:shadow-xs">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  {getEventIcon(evt.type)}
                  <h4 className="text-sm font-semibold text-slate-900">{evt.title}</h4>
                </div>
                <span className="text-[11px] font-medium text-slate-500 shrink-0">{evt.meta}</span>
              </div>
              <p className="text-xs font-medium text-slate-600 leading-relaxed pl-5">
                {evt.description}
              </p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
