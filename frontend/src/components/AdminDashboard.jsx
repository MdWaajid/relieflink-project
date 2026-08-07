import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Map, BarChart3, Filter, AlertTriangle, RefreshCw, CheckCircle2, Clock, Activity, Trophy, Users, Shield, MapPin } from 'lucide-react';
import GoogleDisasterMap from './GoogleDisasterMap';
import AnalyticsCharts from './AnalyticsCharts';
import RequestTimeline from './RequestTimeline';
import SupplyRouteModal from './SupplyRouteModal';
import { api } from '../api';

export default function AdminDashboard({ currentUser, searchQuery = '', searchSector = 'all' }) {
  const [activeTab, setActiveTab] = useState('map'); // 'map', 'requests', 'budget', 'analytics', 'timeline'
  const [camps, setCamps] = useState([]);
  const [ngos, setNgos] = useState([]);
  const [requests, setRequests] = useState([]);
  const [budgetRequests, setBudgetRequests] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedReqForRouteModal, setSelectedReqForRouteModal] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Override Modal state
  const [selectedReqForOverride, setSelectedReqForOverride] = useState(null);
  const [overridePriority, setOverridePriority] = useState('Critical');
  const [overrideReason, setOverrideReason] = useState('');
  const [reassignNgoId, setReassignNgoId] = useState('');

  // Budget Review Modal state
  const [selectedBReqForReview, setSelectedBReqForReview] = useState(null);
  const [bReviewStatus, setBReviewStatus] = useState('Approved');
  const [bApprovedAmount, setBApprovedAmount] = useState('');
  const [bAllocatedType, setBAllocatedType] = useState('Financial Grant (INR)');
  const [bAuthorityNotes, setBAuthorityNotes] = useState('');
  const [reviewingBReq, setReviewingBReq] = useState(false);
  const [bReviewError, setBReviewError] = useState('');

  // Admin Creation Modals
  const [creationModalType, setCreationModalType] = useState(null); // 'ngo', 'camp', 'authority'
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('pass123');
  const [formContact, setFormContact] = useState('');
  const [creationMsg, setCreationMsg] = useState('');
  const [submittingCreation, setSubmittingCreation] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [cList, nList, rList, bList, aData] = await Promise.all([
        api.getCamps(),
        api.getNgos(),
        api.getRequests(),
        api.getBudgetRequests(),
        api.getAnalytics()
      ]);
      setCamps(cList);
      setNgos(nList);
      setRequests(rList);
      setBudgetRequests(bList);
      setAnalytics(aData);
    } catch (err) {
      console.error("Failed to load admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyBudgetReview = async () => {
    if (!selectedBReqForReview) return;
    setBReviewError('');

    if (bReviewStatus === 'Rejected' && (!bAuthorityNotes || bAuthorityNotes.trim() === '')) {
      setBReviewError('⚠️ Rejection explanation is mandatory. Please state why this requisition was rejected.');
      return;
    }

    try {
      setReviewingBReq(true);
      await api.reviewBudgetRequest(selectedBReqForReview.id, {
        status: bReviewStatus,
        approved_amount: bReviewStatus === 'Rejected' ? 0 : parseFloat(bApprovedAmount || 0),
        allocated_type: bAllocatedType,
        authority_notes: bAuthorityNotes
      });
      setSelectedBReqForReview(null);
      setBAuthorityNotes('');
      setBReviewError('');
      await loadAllData();
    } catch (err) {
      setBReviewError(err.response?.data?.detail || 'Failed to review budget request.');
    } finally {
      setReviewingBReq(false);
    }
  };

  const handleApplyOverride = async () => {
    if (!selectedReqForOverride) return;
    try {
      if (overridePriority !== selectedReqForOverride.priority) {
        await api.overridePriority(selectedReqForOverride.id, overridePriority, overrideReason);
      }
      if (reassignNgoId && reassignNgoId !== selectedReqForOverride.matched_ngo_id) {
        await api.reassignRequest(selectedReqForOverride.id, reassignNgoId);
      }
      setSelectedReqForOverride(null);
      setOverrideReason('');
      await loadAllData();
    } catch (err) {
      console.error("Failed to apply admin override:", err);
    }
  };

  const filteredRequests = requests.filter(r => {
    if (statusFilter && r.status !== statusFilter) return false;
    if (priorityFilter && r.priority !== priorityFilter) return false;

    if (searchSector && searchSector !== 'all') {
      if (!r.category.toLowerCase().includes(searchSector.toLowerCase())) return false;
    }

    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      const mCamp = (r.camp_name || '').toLowerCase().includes(q);
      const mCat = (r.category || '').toLowerCase().includes(q);
      const mNgo = (r.matched_ngo_name || '').toLowerCase().includes(q);
      const mId = (r.id || '').toLowerCase().includes(q);
      const mNotes = (r.notes || '').toLowerCase().includes(q);
      if (!mCamp && !mCat && !mNgo && !mId && !mNotes) return false;
    }

    return true;
  });

  const filteredBudgetRequests = budgetRequests.filter(br => {
    if (searchSector && searchSector !== 'all') {
      const sec = searchSector.toLowerCase();
      const reqType = (br.request_type || '').toLowerCase();
      if (!reqType.includes(sec)) return false;
    }
    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      const mNgo = (br.ngo_name || '').toLowerCase().includes(q);
      const mType = (br.request_type || '').toLowerCase().includes(q);
      const mReason = (br.reason || '').toLowerCase().includes(q);
      const mSnap = (br.current_supplies_snapshot || '').toLowerCase().includes(q);
      const mStatus = (br.status || '').toLowerCase().includes(q);
      if (!mNgo && !mType && !mReason && !mSnap && !mStatus) return false;
    }
    return true;
  });

  const handleAdminCreationSubmit = async (e) => {
    e.preventDefault();
    setCreationMsg('');
    setSubmittingCreation(true);
    try {
      if (creationModalType === 'ngo') {
        await api.createNgoWithCoordinator({
          org_name: formName,
          contact_info: formContact || formEmail,
          coord_email: formEmail,
          coord_password: formPassword,
          coord_name: formName + ' Coord'
        });
        setCreationMsg('✅ NGO Organization & Coordinator registered successfully!');
      } else if (creationModalType === 'camp') {
        await api.createCampWithManager({
          name: formName,
          manager_email: formEmail,
          manager_password: formPassword,
          manager_name: formContact || 'Camp Manager',
          capacity: 500,
          current_population: 150
        });
        setCreationMsg('✅ Relief Area Camp & Manager registered successfully!');
      } else if (creationModalType === 'authority') {
        await api.createAuthority({
          email: formEmail,
          password: formPassword,
          display_name: formName
        });
        setCreationMsg('✅ District Authority Officer registered successfully!');
      }
      await loadAllData();
      setTimeout(() => {
        setCreationModalType(null);
        setCreationMsg('');
        setFormName('');
        setFormEmail('');
        setFormContact('');
      }, 1500);
    } catch (err) {
      setCreationMsg(err.response?.data?.detail || 'Creation failed.');
    } finally {
      setSubmittingCreation(false);
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'Critical':
        return (
          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-red-50 text-red-700 border border-red-200 flex items-center gap-1 animate-pulse">
            CRITICAL
          </span>
        );
      case 'High':
        return (
          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            HIGH
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            {priority?.toUpperCase() || 'STANDARD'}
          </span>
        );
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending':
      case 'Matched':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            {status === 'Matched' ? 'MATCHED' : 'PENDING'}
          </span>
        );
      case 'Accepted':
      case 'Dispatched':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
            {status === 'Dispatched' ? 'IN TRANSIT' : 'ACCEPTED'}
          </span>
        );
      case 'Delivered':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            FULFILLED
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            {status?.toUpperCase()}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Deep Navy Seal Hero Banner */}
      <div className="bg-gradient-to-r from-[#0B2545] via-[#13293D] to-[#0B2545] text-white p-8 md:p-12 relative overflow-hidden rounded-b-3xl shadow-md border-l-4 border-l-[#F58220] border-r-4 border-r-[#059669] border-b-4 border-b-[#0B2545]">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <div className="relative z-10 max-w-5xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="bg-[#F58220] text-white text-xs font-bold px-3 py-1 rounded-sm tracking-widest uppercase">
                Apex Command Center
              </span>
              <span className="bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-sm tracking-widest uppercase">
                Government Verified
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Disaster Management Authority Control Dashboard
            </h2>
            <p className="text-slate-200 text-xs md:text-sm font-medium leading-relaxed">
              District Officers review resource demand logs, perform administrative priority overrides, manually reassign NGO logistics lines, and track geo-location dispatches.
            </p>
            
            <div className="flex items-center gap-2 pt-1 text-xs font-bold text-slate-300">
              <Shield className="w-4 h-4 text-[#F58220]" />
              <span>Operational Authority:</span>
              <span className="text-white uppercase font-extrabold">State Disaster Response Force</span>
            </div>
          </div>

          <div className="shrink-0 hidden md:block">
            <img
              src="/relieflink-logo.png"
              alt="ReliefLink Seal Logo"
              className="w-32 h-32 object-contain rounded-full border-4 border-white/20 shadow-xl"
            />
          </div>
        </div>
      </div>

      {/* 2. Floating Metric Counter Bar */}
      <div className="max-w-6xl mx-auto -mt-10 relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 px-4">
        
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-md text-center hover:shadow-lg transition-all hover-pop">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600 mb-2">
            <Activity className="w-5 h-5" />
          </div>
          <span className="text-2xl font-extrabold text-slate-900">{analytics?.total_requests || requests.length}</span>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Total Requisitions</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-md text-center hover:shadow-lg transition-all hover-pop">
          <div className="w-9 h-9 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center mx-auto text-red-600 mb-2">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <span className="text-2xl font-extrabold text-red-700">{requests.filter(r => r.priority === 'Critical' && r.status !== 'Delivered').length}</span>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Critical Pending Needs</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-md text-center hover:shadow-lg transition-all hover-pop">
          <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto text-amber-600 mb-2">
            <Clock className="w-5 h-5" />
          </div>
          <span className="text-2xl font-extrabold text-slate-900">14.2m</span>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Avg Time-to-Match</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-md text-center hover:shadow-lg transition-all hover-pop">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto text-emerald-600 mb-2">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <span className="text-2xl font-extrabold text-emerald-700">94.8%</span>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Fulfillment Rate</p>
        </div>

      </div>

      {/* Main Grid Content */}
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        
        {/* Navigation Tabs Header & Re-registration controls */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-2 flex-wrap gap-y-2">
            <button
              onClick={() => setActiveTab('map')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'map' ? 'bg-slate-900 text-white shadow-xs' : 'bg-transparent text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Map className="w-4 h-4" /> Live Map Frame
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'requests' ? 'bg-slate-900 text-white shadow-xs' : 'bg-transparent text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Filter className="w-4 h-4" /> Requisitions ({requests.length})
            </button>
            <button
              onClick={() => setActiveTab('budget')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'budget' ? 'bg-slate-900 text-white shadow-xs' : 'bg-transparent text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Shield className="w-4 h-4 text-amber-500" /> NGO Budget & Aid ({budgetRequests.filter(b => b.status === 'Pending').length})
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'analytics' ? 'bg-slate-900 text-white shadow-xs' : 'bg-transparent text-slate-600 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-4 h-4" /> Analytics Charts
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'timeline' ? 'bg-slate-900 text-white shadow-xs' : 'bg-transparent text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Clock className="w-4 h-4" /> Official Audit Trail
            </button>
          </div>

          <div className="flex items-center space-x-2 flex-wrap gap-1.5">
            <button
              onClick={() => { setCreationModalType('authority'); setFormName(''); setFormEmail(''); setFormContact(''); setCreationMsg(''); }}
              className="px-3.5 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-[10px] rounded uppercase tracking-wider cursor-pointer flex items-center gap-1 shadow-xs"
            >
              <Shield className="w-3 h-3" /> + Register Admin
            </button>
            <button
              onClick={() => { setCreationModalType('ngo'); setFormName(''); setFormEmail(''); setFormContact(''); setCreationMsg(''); }}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] rounded uppercase tracking-wider cursor-pointer"
            >
              + Register NGO
            </button>
            <button
              onClick={() => { setCreationModalType('camp'); setFormName(''); setFormEmail(''); setFormContact(''); setCreationMsg(''); }}
              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] rounded uppercase tracking-wider cursor-pointer"
            >
              + Register Camp
            </button>
            <button
              onClick={loadAllData}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab 1: Map view */}
        {activeTab === 'map' && (
          <GoogleDisasterMap camps={camps} ngos={ngos} requests={requests} />
        )}

        {/* Tab 2: System-wide Demands Log */}
        {activeTab === 'requests' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            
            <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="border-b-2 border-red-600 inline-block pb-1 text-base font-bold text-slate-900">
                  System Requisition Demand Register
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 font-medium">Verify priority tiers & reassign NGO dispatches</p>
              </div>

              <div className="flex items-center space-x-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Matched">Matched</option>
                  <option value="Accepted">Accepted</option>
                  <option value="Dispatched">Dispatched</option>
                  <option value="Delivered">Delivered</option>
                </select>

                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="">All Priorities</option>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-2xs">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="p-3.5">Camp Location</th>
                    <th className="p-3.5">Category & Requisition Qty</th>
                    <th className="p-3.5">Priority</th>
                    <th className="p-3.5">Assigned Partner</th>
                    <th className="p-3.5">Fulfillment</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700 font-medium">
                  {filteredRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3.5">
                        <div className="space-y-1">
                          <span className="font-bold text-slate-900 block">{req.camp_name || 'Area Camp'}</span>
                          <span className="text-[10px] text-slate-400 block font-normal">Affected: {req.affected_count} people</span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="space-y-1">
                          <span className="font-bold capitalize text-slate-800 block">{req.category.replace('_', ' ')}</span>
                          <span className="text-[10px] text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-bold">
                            {req.quantity} {req.unit}
                          </span>
                        </div>
                      </td>
                      <td className="p-3.5">{getPriorityBadge(req.priority)}</td>
                      <td className="p-3.5">
                        <span className="font-bold text-indigo-700 block">{req.matched_ngo_name || 'Unassigned'}</span>
                        <span className="text-[9px] text-slate-400 font-semibold uppercase block">
                          Logistics Match: {req.priority === 'Critical' ? '96%' : req.priority === 'High' ? '91%' : '88%'}
                        </span>
                      </td>
                      <td className="p-3.5">{getStatusBadge(req.status)}</td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {req.matched_ngo_id && (
                            <button
                              onClick={() => setSelectedReqForRouteModal(req)}
                              className="px-2.5 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-[10px] rounded transition-all cursor-pointer uppercase shadow-2xs flex items-center gap-1"
                            >
                              🚚 Track Route
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedReqForOverride(req);
                              setOverridePriority(req.priority);
                              setReassignNgoId(req.matched_ngo_id || '');
                            }}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] rounded transition-all cursor-pointer uppercase"
                          >
                            Override
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab: NGO Budget & Aid Requisitions */}
        {activeTab === 'budget' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="border-b-2 border-amber-600 inline-block pb-1 text-base font-bold text-slate-900">
                  NGO Emergency Budget & Supply Aid Control
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 font-medium">Review inventory snapshots, allocate financial grants, or dispatch government emergency supplies</p>
              </div>
              <span className="px-3 py-1 bg-amber-50 rounded-full text-xs font-bold text-amber-800 border border-amber-200">
                {budgetRequests.filter(b => b.status === 'Pending').length} Requisitions Pending Review
              </span>
            </div>

            {filteredBudgetRequests.length === 0 ? (
              <div className="py-12 text-center text-slate-500 bg-slate-50 border border-dashed border-slate-200 rounded-2xl font-medium">
                No matching budget or supply aid requisitions found.
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-2xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="p-3.5">NGO Organization</th>
                      <th className="p-3.5">Requested Aid Type</th>
                      <th className="p-3.5">Requested Amount</th>
                      <th className="p-3.5">Current Stock Level Snapshot</th>
                      <th className="p-3.5">Urgency Reason</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700 font-medium">
                    {filteredBudgetRequests.map((br) => (
                      <tr key={br.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3.5 font-bold text-slate-900">{br.ngo_name || 'NGO Partner'}</td>
                        <td className="p-3.5 font-bold text-indigo-800">{br.request_type}</td>
                        <td className="p-3.5 font-bold text-slate-900">
                          {br.unit === 'INR' ? `₹${br.requested_amount.toLocaleString()}` : `${br.requested_amount} ${br.unit}`}
                        </td>
                        <td className="p-3.5 max-w-xs font-mono text-[10px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-200">
                          {br.current_supplies_snapshot || 'No stock info'}
                        </td>
                        <td className="p-3.5 text-[11px] text-slate-600 max-w-xs">{br.reason}</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            br.status === 'Approved' || br.status === 'Disbursed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : br.status === 'Rejected'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {br.status?.toUpperCase()}
                          </span>
                          {br.authority_notes && (
                            <span className="block text-[10px] text-slate-500 italic mt-0.5 max-w-xs">
                              Remark: {br.authority_notes}
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => {
                                setSelectedBReqForReview(br);
                                setBReviewStatus('Approved');
                                setBApprovedAmount(br.requested_amount);
                                setBAllocatedType(br.request_type);
                                setBAuthorityNotes('');
                                setBReviewError('');
                              }}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded transition-all cursor-pointer uppercase shadow-2xs"
                            >
                              Approve / Disburse
                            </button>
                            <button
                              onClick={() => {
                                setSelectedBReqForReview(br);
                                setBReviewStatus('Rejected');
                                setBApprovedAmount(0);
                                setBAllocatedType(br.request_type);
                                setBAuthorityNotes('');
                                setBReviewError('');
                              }}
                              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] rounded transition-all cursor-pointer uppercase shadow-2xs"
                            >
                              Reject Requisition
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Analytics section */}
        {activeTab === 'analytics' && (
          <AnalyticsCharts analytics={analytics} />
        )}

        {/* Tab 4: Audit trail timeline */}
        {activeTab === 'timeline' && (
          <RequestTimeline />
        )}

      </div>

      {/* Authority Override Modal */}
      {selectedReqForOverride && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-3xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Authority Override & Reassignment
            </h3>
            
            <p className="text-xs font-medium text-slate-600">
              Request: <strong className="text-slate-900 capitalize">{selectedReqForOverride.category} ({selectedReqForOverride.quantity} {selectedReqForOverride.unit})</strong> at {selectedReqForOverride.camp_name}
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Set Override Priority Tier:</label>
              <select
                value={overridePriority}
                onChange={(e) => setOverridePriority(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 cursor-pointer"
              >
                <option value="Critical">🔴 Critical (Immediate Disaster Threat)</option>
                <option value="High">🟠 High Priority</option>
                <option value="Normal">🔵 Normal Priority</option>
                <option value="Low">🟢 Low Priority</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Reassign Nodal NGO Unit:</label>
              <select
                value={reassignNgoId}
                onChange={(e) => setReassignNgoId(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 cursor-pointer"
              >
                <option value="">-- Keep Current NGO Assignment --</option>
                {ngos.map((ngo) => (
                  <option key={ngo.id} value={ngo.id}>
                    {ngo.org_name} (Dist: {ngo.district || 'Zone 1'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Audit Trail Reason / Justification:</label>
              <textarea
                rows="3"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="State the official administrative directive reason..."
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                required
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setSelectedReqForOverride(null)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyOverride}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl cursor-pointer"
              >
                Apply Override Directive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Creation Modals (NGO, Camp, Authority Admin) */}
      {creationModalType && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-3xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>
                  {creationModalType === 'ngo' ? '🤝 Register New NGO Organization' : creationModalType === 'camp' ? '⛺ Register New Relief Camp' : '🛡️ Register New Admin Officer'}
                </span>
              </h3>
              <button onClick={() => setCreationModalType(null)} className="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer">✕ Close</button>
            </div>

            <form onSubmit={handleAdminCreationSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {creationModalType === 'ngo' ? 'NGO Organization Name:' : creationModalType === 'camp' ? 'Relief Camp Location Name:' : 'Admin Officer Name / Designation:'}
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder={creationModalType === 'ngo' ? 'e.g. Hope Relief Foundation' : creationModalType === 'camp' ? 'e.g. South Zone Base Camp' : 'e.g. District Disaster Magistrate'}
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Login Email Address:</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="user@relieflink.org"
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Account Password:</label>
                <input
                  type="text"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                  required
                />
              </div>

              {creationMsg && (
                <p className={`p-2.5 rounded-xl text-xs font-semibold ${creationMsg.includes('✅') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                  {creationMsg}
                </p>
              )}

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreationModalType(null)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCreation}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  {submittingCreation ? 'Processing...' : 'Register Entity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Authority Budget / Supply Aid Review Modal */}
      {selectedBReqForReview && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-3xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
              <span>Review NGO Budget & Aid Requisition</span>
              <span className={`text-[10px] px-2.5 py-0.5 rounded font-bold uppercase ${
                bReviewStatus === 'Rejected' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {bReviewStatus}
              </span>
            </h3>

            <div className="space-y-1 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <p>NGO Partner: <strong className="text-slate-900">{selectedBReqForReview.ngo_name}</strong></p>
              <p>Requisition: <strong className="text-indigo-800">{selectedBReqForReview.request_type}</strong></p>
              <p>Requested: <strong className="text-slate-900">{selectedBReqForReview.unit === 'INR' ? `₹${selectedBReqForReview.requested_amount.toLocaleString()}` : `${selectedBReqForReview.requested_amount} ${selectedBReqForReview.unit}`}</strong></p>
              <p className="text-[10px] text-slate-500 font-mono mt-1">Snapshot: {selectedBReqForReview.current_supplies_snapshot}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Decision Status:</label>
              <select
                value={bReviewStatus}
                onChange={(e) => {
                  setBReviewStatus(e.target.value);
                  setBReviewError('');
                }}
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 cursor-pointer"
              >
                <option value="Approved">Approved</option>
                <option value="Disbursed">Disbursed & Replenished</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            {bReviewStatus === 'Rejected' && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <span>🚫 Requisition Rejection Notice</span>
                </p>
                <p className="text-[11px]">
                  An official explanation note is required below so the NGO coordinator understands why their emergency request was declined.
                </p>
              </div>
            )}

            {bReviewStatus !== 'Rejected' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Approved Amount / Qty:</label>
                  <input
                    type="number"
                    value={bApprovedAmount}
                    onChange={(e) => setBApprovedAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Grant / Allocation Type:</label>
                  <input
                    type="text"
                    value={bAllocatedType}
                    onChange={(e) => setBAllocatedType(e.target.value)}
                    placeholder="e.g. Food Rations, Financial Grant"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {bReviewStatus === 'Rejected' ? 'Rejection Reason / Explanation (Mandatory)*:' : 'Official Remarks / Authority Note:'}
              </label>
              <textarea
                rows="3"
                value={bAuthorityNotes}
                onChange={(e) => {
                  setBAuthorityNotes(e.target.value);
                  if (e.target.value.trim() !== '') setBReviewError('');
                }}
                placeholder={bReviewStatus === 'Rejected' ? 'State the specific reason for rejecting this aid request...' : 'District Disaster Authority sanction remarks...'}
                className={`w-full px-4 py-2 bg-white border rounded-xl text-xs font-medium text-slate-900 ${
                  bReviewStatus === 'Rejected' && (!bAuthorityNotes || bAuthorityNotes.trim() === '') ? 'border-rose-400 focus:ring-2 focus:ring-rose-500/20' : 'border-slate-200'
                }`}
                required={bReviewStatus === 'Rejected'}
              />
            </div>

            {bReviewError && (
              <p className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700">
                {bReviewError}
              </p>
            )}

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => {
                  setSelectedBReqForReview(null);
                  setBReviewError('');
                }}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyBudgetReview}
                disabled={reviewingBReq}
                className={`px-5 py-2 text-white font-semibold text-xs rounded-xl cursor-pointer transition-all ${
                  bReviewStatus === 'Rejected' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-slate-900 hover:bg-slate-800'
                }`}
              >
                {reviewingBReq ? 'Saving...' : bReviewStatus === 'Rejected' ? 'Confirm Rejection' : 'Confirm Decision & Disburse Aid'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Supply Transport Route Tracker Modal */}
      {selectedReqForRouteModal && (
        <SupplyRouteModal
          request={selectedReqForRouteModal}
          camp={camps.find(c => c.id === selectedReqForRouteModal.camp_id) || camps[0]}
          ngo={ngos.find(n => n.id === selectedReqForRouteModal.matched_ngo_id) || ngos[0]}
          onClose={() => setSelectedReqForRouteModal(null)}
        />
      )}

    </div>
  );
}
