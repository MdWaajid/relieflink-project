import React from 'react';
import { Users, Droplets, ShieldCheck, Truck, Activity, Heart, Package } from 'lucide-react';

export default function DisasterTelemetryBar({ totalServed = 1450, totalCapacity = 2000, activeDispatches = 4 }) {
  const coveragePercent = Math.min(100, Math.round((totalServed / (totalCapacity || 1)) * 100));

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <span>Disaster Relief Operations Telemetry</span>
            <span className="bg-emerald-50 text-emerald-700 text-[10px] px-2 py-0.5 rounded font-bold border border-emerald-200 uppercase">
              Operational Readiness 94%
            </span>
          </h4>
          <p className="text-[11px] text-slate-500 font-medium">Real-time resource distribution metrics & refugee shelter capacity</p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
          <Activity className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
          <span>Active Command Telemetry</span>
        </div>
      </div>

      {/* Progress Bars & Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold">
        
        {/* Metric 1: Refugee Population Coverage */}
        <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-700 font-bold flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-600" /> Ground Population Coverage
            </span>
            <span className="text-indigo-700 font-extrabold">{coveragePercent}%</span>
          </div>
          
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${coveragePercent}%` }}
            />
          </div>
          
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Sheltered: {totalServed} people</span>
            <span>Capacity: {totalCapacity}</span>
          </div>
        </div>

        {/* Metric 2: Food & Ration Distribution Rate */}
        <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-700 font-bold flex items-center gap-1.5">
              <Package className="w-4 h-4 text-emerald-600" /> Ration Supply Fulfillment
            </span>
            <span className="text-emerald-700 font-extrabold">89%</span>
          </div>
          
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-500"
              style={{ width: '89%' }}
            />
          </div>
          
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Distributed: 4,800 Packets</span>
            <span>Target: 5,400</span>
          </div>
        </div>

        {/* Metric 3: Water Pipeline & Tanker Status */}
        <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-700 font-bold flex items-center gap-1.5">
              <Droplets className="w-4 h-4 text-cyan-600" /> Clean Drinking Water Line
            </span>
            <span className="text-cyan-700 font-extrabold">96%</span>
          </div>
          
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-cyan-600 h-full rounded-full transition-all duration-500"
              style={{ width: '96%' }}
            />
          </div>
          
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Dispatched: 18,500 Liters</span>
            <span>Safe Supply Verified</span>
          </div>
        </div>

      </div>

    </div>
  );
}
