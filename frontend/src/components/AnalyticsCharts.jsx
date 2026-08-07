import React from 'react';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Trophy, Activity, AlertTriangle, Users } from 'lucide-react';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function AnalyticsCharts({ analytics }) {
  if (!analytics) return <div className="py-8 text-center text-slate-500 font-medium">Loading analytics data...</div>;

  // Donut Chart: Request Status Breakdown
  const statusData = {
    labels: ['Pending', 'Matched', 'Dispatched', 'Delivered'],
    datasets: [
      {
        data: [
          analytics.pending_requests || 0,
          analytics.matched_requests || 0,
          analytics.dispatched_requests || 0,
          analytics.delivered_requests || 0,
        ],
        backgroundColor: ['#64748b', '#6366f1', '#06b6d4', '#10b981'],
        borderWidth: 0,
      },
    ],
  };

  // Bar Chart: Requests by Priority
  const priorityLabels = Object.keys(analytics.requests_by_priority || {});
  const priorityCounts = Object.values(analytics.requests_by_priority || {});
  
  const priorityData = {
    labels: priorityLabels.length > 0 ? priorityLabels : ['Critical', 'High', 'Medium', 'Low'],
    datasets: [
      {
        label: 'Demands Count',
        data: priorityCounts.length > 0 ? priorityCounts : [2, 3, 4, 1],
        backgroundColor: ['#f43f5e', '#f59e0b', '#64748b', '#10b981'],
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#64748b', font: { family: 'Inter', size: 11, weight: '500' } }
      }
    },
    scales: {
      x: { ticks: { color: '#64748b', font: { size: 11 } }, grid: { color: 'rgba(0,0,0,0.04)' } },
      y: { ticks: { color: '#64748b', font: { size: 11 } }, grid: { color: 'rgba(0,0,0,0.04)' } }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 p-5 rounded-2xl flex items-center space-x-3.5 shadow-sm">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Total Requests</span>
            <span className="text-2xl font-extrabold text-slate-900">{analytics.total_requests || 0}</span>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 p-5 rounded-2xl flex items-center space-x-3.5 shadow-sm">
          <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Critical Needs</span>
            <span className="text-2xl font-extrabold text-rose-700">{analytics.critical_requests || 0}</span>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 p-5 rounded-2xl flex items-center space-x-3.5 shadow-sm">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Fulfilled / Delivered</span>
            <span className="text-2xl font-extrabold text-emerald-700">{analytics.delivered_requests || 0}</span>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 p-5 rounded-2xl flex items-center space-x-3.5 shadow-sm">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Active NGOs</span>
            <span className="text-2xl font-extrabold text-indigo-700">{analytics.total_ngos || 0}</span>
          </div>
        </div>
      </div>

      {/* Visual Chart Visualizations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Status Donut */}
        <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4">
            Lifecycle Status Distribution
          </h4>
          <div className="h-56 relative flex items-center justify-center">
            <Doughnut data={statusData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#64748b', font: { family: 'Inter', size: 11, weight: '500' } } } } }} />
          </div>
        </div>

        {/* Priority Bar Chart */}
        <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4">
            Demands by Priority Level
          </h4>
          <div className="h-56">
            <Bar data={priorityData} options={chartOptions} />
          </div>
        </div>

      </div>

      {/* NGO Fulfillment Leaderboard */}
      <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 p-6 rounded-2xl shadow-sm">
        <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 mb-3 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" />
          Top NGO Fulfillment Leaderboard
        </h4>
        <div className="divide-y divide-slate-100">
          {(analytics.ngo_leaderboard || []).map((ngo, idx) => (
            <div key={idx} className="py-3 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-3">
                <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center border border-slate-200/80">
                  #{idx + 1}
                </span>
                <span className="font-bold text-slate-900 text-sm">{ngo.ngo_name}</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-slate-500 font-medium">{ngo.contact_info}</span>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-full border border-emerald-100">
                  {ngo.fulfilled_count} Dispatches Completed
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
