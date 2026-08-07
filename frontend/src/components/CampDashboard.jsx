import React, { useState, useEffect } from 'react';
import { Tent, PlusCircle, AlertCircle, Clock, CheckCircle2, Truck, Sparkles, FileText, Users, MapPin, Layers } from 'lucide-react';
import { api } from '../api';
import SupplyRouteModal from './SupplyRouteModal';

export default function CampDashboard({ currentUser, onRefreshNeeded, searchQuery = '', searchSector = 'all' }) {
  const [camps, setCamps] = useState([]);
  const [ngos, setNgos] = useState([]);
  const [selectedCampId, setSelectedCampId] = useState('');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedReqForRouteModal, setSelectedReqForRouteModal] = useState(null);

  // Population Edit state
  const [editingPop, setEditingPop] = useState(false);
  const [popVal, setPopVal] = useState(100);
  const [savingPop, setSavingPop] = useState(false);

  // New Request Form State
  const [category, setCategory] = useState('drinking_water');
  const [quantity, setQuantity] = useState(1000);
  const [unit, setUnit] = useState('Liters');
  const [affectedCount, setAffectedCount] = useState(250);
  const [notes, setNotes] = useState('');

  const CATEGORY_UNITS = {
    drinking_water: 'Liters',
    food: 'Packets',
    medicine: 'Kits',
    blankets: 'Pieces',
    clothes: 'Sets',
    shelter: 'Tents'
  };

  const handleCategoryChange = (newCat) => {
    setCategory(newCat);
    setUnit(CATEGORY_UNITS[newCat] || 'Units');
  };

  const getPriorityPreview = () => {
    const catClean = category.toLowerCase();
    if (catClean.includes('water') || catClean.includes('medicine')) return 'Critical';
    if (parseInt(affectedCount || 0) >= 200) return 'Critical';
    if (catClean.includes('food') || catClean.includes('shelter')) return 'High';
    if (catClean.includes('blanket') || catClean.includes('clothes')) return 'Medium';
    return 'Low';
  };

  useEffect(() => {
    loadCampData();
  }, [currentUser]);

  const loadCampData = async () => {
    try {
      setLoading(true);
      let campList = [];
      if (currentUser?.id) {
        campList = await api.getCamps({ owner_id: currentUser.id });
      }
      
      if (campList.length === 0) {
        const allCamps = await api.getCamps();
        if (currentUser?.campId) {
          campList = allCamps.filter(c => c.id === currentUser.campId);
        }
        if (campList.length === 0) campList = allCamps;
      }

      setCamps(campList);

      const activeId = campList.length > 0 ? campList[0].id : (currentUser?.campId || '');
      setSelectedCampId(activeId);
      const activeCamp = campList.find(c => c.id === activeId);
      if (activeCamp) setPopVal(activeCamp.current_population);

      const [allNgos, reqList] = await Promise.all([
        api.getNgos(),
        activeId ? api.getRequests({ camp_id: activeId }) : api.getRequests()
      ]);
      setNgos(allNgos);
      setRequests(reqList);
    } catch (err) {
      console.error("Failed to load camp data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePopulationSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCampId) return;
    try {
      setSavingPop(true);
      await api.updateCamp(selectedCampId, { current_population: parseInt(popVal) });
      await loadCampData();
      setEditingPop(false);
    } catch (err) {
      console.error("Failed to update population:", err);
    } finally {
      setSavingPop(false);
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!selectedCampId) return;

    try {
      setSubmitting(true);
      await api.createRequest({
        camp_id: selectedCampId,
        category,
        quantity: parseInt(quantity),
        unit,
        affected_count: parseInt(affectedCount),
        notes
      });

      setNotes('');
      await loadCampData();
      if (onRefreshNeeded) onRefreshNeeded();
    } catch (err) {
      console.error("Failed to create request:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCamp = camps.find(c => c.id === selectedCampId);
  const campRequests = requests.filter(r => {
    if (r.camp_id !== selectedCampId) return false;
    if (searchSector && searchSector !== 'all') {
      if (!r.category.toLowerCase().includes(searchSector.toLowerCase())) return false;
    }
    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      const mCat = (r.category || '').toLowerCase().includes(q);
      const mStatus = (r.status || '').toLowerCase().includes(q);
      const mNotes = (r.notes || '').toLowerCase().includes(q);
      const mNgo = (r.matched_ngo_name || '').toLowerCase().includes(q);
      const mId = (r.id || '').toLowerCase().includes(q);
      if (!mCat && !mStatus && !mNotes && !mNgo && !mId) return false;
    }
    return true;
  });

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'Critical':
        return (
          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-red-50 text-red-700 border border-red-200 flex items-center gap-1 animate-pulse">
            <AlertCircle className="w-3 h-3" /> CRITICAL
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
          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> {status === 'Matched' ? 'MATCHED' : 'PENDING'}
          </span>
        );
      case 'Accepted':
      case 'Dispatched':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200 flex items-center gap-1">
            <Truck className="w-3.5 h-3.5" /> {status === 'Dispatched' ? 'IN TRANSIT' : 'ACCEPTED'}
          </span>
        );
      case 'Delivered':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> FULFILLED
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
      
      {/* 1. Deep Navy Hero Banner (India.gov.in style) */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-8 md:p-12 relative overflow-hidden rounded-b-3xl shadow-md border-b-4 border-red-600">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <div className="relative z-10 max-w-4xl space-y-3">
          <span className="bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-sm tracking-widest uppercase">
            Emergency Command Unit
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Relief Camp Operational Demands Control
          </h2>
          <p className="text-slate-300 text-xs md:text-sm font-medium leading-relaxed max-w-2xl">
            This module registers urgent resource needs at the ground level and streams live allocation logs with government-vetted NGO logistics partners.
          </p>
          
          <div className="flex items-center gap-2 pt-2 text-[11px] font-bold text-slate-400">
            <MapPin className="w-3.5 h-3.5 text-red-500" />
            <span>Active Sector:</span>
            <span className="text-white uppercase">{selectedCamp?.name || 'Central Flood Zone'}</span>
          </div>
        </div>
      </div>

      {/* 2. Floating Metric Counter Bar */}
      <div className="max-w-6xl mx-auto -mt-10 relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 px-4">
        
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-md text-center hover:shadow-lg transition-all hover-pop">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600 mb-2">
            <Tent className="w-5 h-5" />
          </div>
          <span className="text-2xl font-extrabold text-slate-900">{selectedCamp?.name ? 1 : camps.length}</span>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Operational Camps</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-md text-center hover:shadow-lg transition-all hover-pop relative">
          <div className="w-9 h-9 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center mx-auto text-red-600 mb-2">
            <Users className="w-5 h-5" />
          </div>
          
          {editingPop ? (
            <form onSubmit={handleUpdatePopulationSubmit} className="flex items-center justify-center gap-1">
              <input
                type="number"
                value={popVal}
                onChange={(e) => setPopVal(e.target.value)}
                className="w-16 px-1 py-0.5 border border-slate-300 rounded text-center text-sm font-bold"
                autoFocus
              />
              <button type="submit" disabled={savingPop} className="text-[10px] bg-slate-900 text-white px-2 py-1 rounded font-bold uppercase cursor-pointer">
                Save
              </button>
            </form>
          ) : (
            <div className="flex items-center justify-center gap-1">
              <span className="text-2xl font-extrabold text-slate-900">{selectedCamp?.current_population || 0}</span>
              <button
                onClick={() => { setPopVal(selectedCamp?.current_population || 0); setEditingPop(true); }}
                className="text-[9px] text-indigo-600 underline font-semibold ml-1 cursor-pointer"
              >
                Edit
              </button>
            </div>
          )}
          
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Sheltered Population</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-md text-center hover:shadow-lg transition-all hover-pop">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto text-emerald-600 mb-2">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <span className="text-2xl font-extrabold text-slate-900">{campRequests.filter(r => r.status === 'Delivered').length}</span>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Fulfilled Demands</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-md text-center hover:shadow-lg transition-all hover-pop">
          <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto text-amber-600 mb-2">
            <AlertCircle className="w-5 h-5" />
          </div>
          <span className="text-2xl font-extrabold text-slate-900">{campRequests.filter(r => r.priority === 'Critical' && r.status !== 'Delivered').length}</span>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Critical Open Needs</p>
        </div>

      </div>

      {/* Main Grid Content */}
      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Create Resource Request Form */}
        <div className="lg:col-span-1 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="border-b-2 border-red-600 inline-block pb-1 text-base font-bold text-slate-900">
              New Resource Requisition
            </h3>
            <p className="text-[11px] text-slate-500 mt-1.5 font-medium leading-relaxed">
              Fill in ground details to stream real-time priority alerts to NGO networks.
            </p>
          </div>

          <form onSubmit={handleCreateRequest} className="space-y-4">
            
            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Resource Category
              </label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all cursor-pointer"
              >
                <option value="drinking_water">💧 Drinking Water</option>
                <option value="medicine">💊 Medicines & First Aid</option>
                <option value="food">🍲 Food & Dry Rations</option>
                <option value="blankets">🛋️ Blankets & Bedding</option>
                <option value="clothes">👕 Clothes & Apparels</option>
                <option value="shelter">⛺ Shelter Tents & Tarpaulins</option>
              </select>
            </div>

            {/* Quantity & Unit */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Quantity Needed
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Unit
                </label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Affected People Count */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Affected Population Count
              </label>
              <input
                type="number"
                min="1"
                value={affectedCount}
                onChange={(e) => setAffectedCount(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all"
                required
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Ground Situation Notes
              </label>
              <textarea
                rows="2"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Specific urgency context..."
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 transition-all"
              />
            </div>

            {/* Auto Priority Preview Badge */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <span className="text-xs text-slate-600 font-semibold">Priority Rating Preview:</span>
              {getPriorityBadge(getPriorityPreview())}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full px-5 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all duration-200 cursor-pointer flex items-center justify-center space-x-2 uppercase"
            >
              {submitting ? (
                <span>Publishing & Matching...</span>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  <span>Register Requisition</span>
                </>
              )}
            </button>

          </form>
        </div>

        {/* Right Column: High-density Portal Demand Logs Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="border-b-2 border-red-600 inline-block pb-1 text-base font-bold text-slate-900">
                  Regional Requisition Demand Log
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 font-medium">Verified demand stamps & matching statuses</p>
              </div>
              <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-700 border border-slate-200">
                {campRequests.length} Demands Logged
              </span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-500 font-medium">Loading demands...</div>
            ) : campRequests.length === 0 ? (
              <div className="py-12 text-center text-slate-500 bg-slate-50 border border-dashed border-slate-200 rounded-2xl font-medium">
                No active demands registered for this camp.
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-2xs">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="p-3.5 font-bold">Request ID</th>
                      <th className="p-3.5 font-bold">Category & Qty</th>
                      <th className="p-3.5 font-bold">Affected Pop</th>
                      <th className="p-3.5 font-bold">Priority</th>
                      <th className="p-3.5 font-bold">Fulfillment Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700 font-medium">
                    {campRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3.5 font-bold text-slate-900">#{req.id}</td>
                        <td className="p-3.5">
                          <div className="space-y-1">
                            <span className="font-bold text-slate-800 capitalize block">
                              {req.category.replace('_', ' ')}
                            </span>
                            <span className="text-[10px] text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                              {req.quantity} {req.unit}
                            </span>
                          </div>
                        </td>
                        <td className="p-3.5 font-semibold text-slate-900">{req.affected_count} people</td>
                        <td className="p-3.5">{getPriorityBadge(req.priority)}</td>
                        <td className="p-3.5">
                          <div className="space-y-1">
                            {getStatusBadge(req.status)}
                            {req.matched_ngo_name && (
                              <span className="block text-[10px] text-indigo-600 font-semibold">
                                Assigned: {req.matched_ngo_name}
                              </span>
                            )}
                            <button
                              onClick={() => setSelectedReqForRouteModal(req)}
                              className="mt-1 px-2.5 py-1 bg-cyan-600 hover:bg-cyan-700 active:bg-cyan-800 text-white font-bold text-[10px] rounded flex items-center gap-1 transition-all cursor-pointer shadow-2xs uppercase"
                            >
                              🚚 Track Live Route
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
        </div>

      </div>

      {/* Live Supply Transport Route Tracker Modal */}
      {selectedReqForRouteModal && (
        <SupplyRouteModal
          request={selectedReqForRouteModal}
          camp={camps.find(c => c.id === selectedReqForRouteModal.camp_id) || camps.find(c => c.id === selectedCampId) || camps[0]}
          ngo={ngos.find(n => n.id === selectedReqForRouteModal.matched_ngo_id) || ngos[0]}
          onClose={() => setSelectedReqForRouteModal(null)}
        />
      )}

    </div>
  );
}
