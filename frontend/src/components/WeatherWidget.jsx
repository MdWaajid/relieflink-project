import React from 'react';
import { CloudRain, Wind, Thermometer, AlertTriangle, ShieldCheck, Waves, Compass, SunDim } from 'lucide-react';

export default function WeatherWidget() {
  return (
    <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-lg relative overflow-hidden space-y-4">
      {/* Background radial highlight */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Ticker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4 relative z-10">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shrink-0">
            <CloudRain className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold tracking-tight text-white flex items-center gap-2">
              Regional Meteorological Radar
              <span className="text-[9px] bg-red-600/90 text-white px-2 py-0.5 rounded font-bold uppercase tracking-wider animate-pulse">
                IMD Alert
              </span>
            </h4>
            <p className="text-[11px] text-slate-400 font-medium">Coastal Zone 1 Monitoring · District Response Center</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs font-bold bg-slate-800/60 px-3.5 py-1.5 rounded-xl border border-slate-700/60">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-slate-300">Live Satellite Link Active</span>
        </div>
      </div>

      {/* Weather Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10">
        
        <div className="bg-slate-800/40 border border-slate-700/50 p-3.5 rounded-2xl space-y-1 hover:border-slate-600 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Temperature</span>
            <Thermometer className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-lg font-black text-white">28°C <span className="text-[10px] font-semibold text-slate-400">Humid</span></p>
        </div>

        <div className="bg-slate-800/40 border border-slate-700/50 p-3.5 rounded-2xl space-y-1 hover:border-slate-600 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Precipitation</span>
            <CloudRain className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-lg font-black text-white">42 mm/h <span className="text-[10px] text-cyan-300 font-semibold">Heavy</span></p>
        </div>

        <div className="bg-slate-800/40 border border-slate-700/50 p-3.5 rounded-2xl space-y-1 hover:border-slate-600 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Wind Speed</span>
            <Wind className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-lg font-black text-white">54 km/h <span className="text-[10px] text-amber-300 font-semibold">Gusting</span></p>
        </div>

        <div className="bg-slate-800/40 border border-slate-700/50 p-3.5 rounded-2xl space-y-1 hover:border-slate-600 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Flood Risk Level</span>
            <Waves className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-lg font-black text-rose-400">Moderate <span className="text-[10px] text-rose-300 font-semibold">Tier 2</span></p>
        </div>

      </div>

      {/* Advisory Alert Banner */}
      <div className="bg-gradient-to-r from-red-950/60 via-amber-950/40 to-slate-900 border border-red-800/50 p-3 rounded-2xl flex items-center justify-between gap-3 text-xs relative z-10">
        <div className="flex items-center space-x-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
          <p className="text-slate-200 font-medium text-[11px] leading-tight">
            <strong className="text-amber-300">IMD Weather Bulletin:</strong> Heavy rainfall expected over coastal sectors. Logistics trucks advised to use High-Speed Transit Corridor #3.
          </p>
        </div>
        <span className="text-[10px] text-slate-400 font-mono shrink-0 hidden md:inline">Updated 5m ago</span>
      </div>

    </div>
  );
}
