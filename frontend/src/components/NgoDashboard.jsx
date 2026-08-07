import React, { useState, useEffect } from 'react';
import { HeartHandshake, PackageCheck, Sparkles, Check, Truck, CheckCircle2, UserCheck, Shield, MapPin, Activity } from 'lucide-react';
import { api } from '../api';
import SupplyRouteModal from './SupplyRouteModal';

export default function NgoDashboard({ currentUser, onRefreshNeeded, searchQuery = '', searchSector = 'all' }) {
  const [ngos, setNgos] = useState([]);
  const [camps, setCamps] = useState([]);
  const [selectedNgoId, setSelectedNgoId] = useState('');
  const [resources, setResources] = useState([]);
  const [requests, setRequests] = useState([]);
  const [budgetRequests, setBudgetRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReqForRouteModal, setSelectedReqForRouteModal] = useState(null);

  // New stock form
  const [category, setCategory] = useState('drinking_water');
  const [quantity, setQuantity] = useState(2000);
  const [unit, setUnit] = useState('Liters');
  const [addingResource, setAddingResource] = useState(false);

  // Budget Request Modal state
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [bRequestType, setBRequestType] = useState('Financial Grant (INR)');
  const [bRequestedAmount, setBRequestedAmount] = useState(100000);
  const [bUnit, setBUnit] = useState('INR');
  const [bReason, setBReason] = useState('');
  const [submittingBudget, setSubmittingBudget] = useState(false);
  const [budgetMsg, setBudgetMsg] = useState('');

  // Create Camp Modal state
  const [showCreateCampModal, setShowCreateCampModal] = useState(false);
  const [campAreaName, setCampAreaName] = useState('');
  const [managerName, setManagerName] = useState('');
  const [managerEmail, setManagerEmail] = useState('');
  const [managerPassword, setManagerPassword] = useState('camp123');
  const [campCapacity, setCampCapacity] = useState(500);
  const [campPopulation, setCampPopulation] = useState(150);
  const [creatingCamp, setCreatingCamp] = useState(false);
  const [createCampMsg, setCreateCampMsg] = useState('');

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

  useEffect(() => {
    loadNgoData();
  }, [currentUser]);

  const loadNgoData = async () => {
    try {
      setLoading(true);
      let ngoList = [];
      if (currentUser?.id) {
        ngoList = await api.getNgos({ owner_id: currentUser.id });
      }

      if (ngoList.length === 0) {
        const allNgos = await api.getNgos();
        if (currentUser?.ngoId) {
          ngoList = allNgos.filter(n => n.id === currentUser.ngoId);
        }
        if (ngoList.length === 0) ngoList = allNgos;
      }

      setNgos(ngoList);
      const activeId = ngoList.length > 0 ? ngoList[0].id : (currentUser?.ngoId || '');
      setSelectedNgoId(activeId);

      if (activeId) {
        const [resList, bList] = await Promise.all([
          api.getNgoResources(activeId),
          api.getBudgetRequests({ ngo_id: activeId })
        ]);
        setResources(resList);
        setBudgetRequests(bList);
      }

      const [reqList, campList] = await Promise.all([
        api.getRequests(),
        api.getCamps()
      ]);
      setRequests(reqList);
      setCamps(campList);
    } catch (err) {
      console.error("Failed to load NGO data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBudgetSubmit = async (e) => {
    e.preventDefault();
    if (!selectedNgoId) return;

    try {
      setSubmittingBudget(true);
      setBudgetMsg('');
      await api.createBudgetRequest({
        ngo_id: selectedNgoId,
        request_type: bRequestType,
        requested_amount: parseFloat(bRequestedAmount),
        unit: bUnit,
        reason: bReason
      });
      setBudgetMsg('✅ Emergency Budget / Aid Requisition submitted to District Authorities!');
      const bList = await api.getBudgetRequests({ ngo_id: selectedNgoId });
      setBudgetRequests(bList);
      setTimeout(() => {
        setShowBudgetModal(false);
        setBudgetMsg('');
        setBReason('');
      }, 1500);
    } catch (err) {
      setBudgetMsg(err.response?.data?.detail || 'Failed to submit budget request.');
    } finally {
      setSubmittingBudget(false);
    }
  };

  const handleAddStock = async (e) => {
    e.preventDefault();
    if (!selectedNgoId) return;

    try {
      setAddingResource(true);
      await api.addResource(selectedNgoId, {
        category,
        quantity: parseInt(quantity),
        unit
      });
      const resList = await api.getNgoResources(selectedNgoId);
      setResources(resList);
    } catch (err) {
      console.error("Failed to add resource stock:", err);
    } finally {
      setAddingResource(false);
    }
  };

  const handleAcceptRequest = async (reqId) => {
    try {
      await api.acceptRequest(reqId);
      await loadNgoData();
      if (onRefreshNeeded) onRefreshNeeded();
    } catch (err) {
      console.error("Failed to accept request:", err);
    }
  };

  const handleStatusUpdate = async (reqId, newStatus) => {
    try {
      await api.updateRequestStatus(reqId, newStatus);
      await loadNgoData();
      if (onRefreshNeeded) onRefreshNeeded();
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleCreateCampSubmit = async (e) => {
    e.preventDefault();
    setCreateCampMsg('');
    setCreatingCamp(true);
    try {
      await api.createCampWithManager({
        name: campAreaName,
        manager_name: managerName,
        manager_email: managerEmail,
        manager_password: managerPassword,
        capacity: parseInt(campCapacity),
        current_population: parseInt(campPopulation)
      });
      setCreateCampMsg('✅ Relief Area Camp created successfully!');
      setTimeout(() => {
        setShowCreateCampModal(false);
        setCreateCampMsg('');
        setCampAreaName('');
        setManagerName('');
        setManagerEmail('');
      }, 1500);
    } catch (err) {
      setCreateCampMsg(err.response?.data?.detail || 'Failed to create camp.');
    } finally {
      setCreatingCamp(false);
    }
  };

  const selectedNgo = ngos.find(n => n.id === selectedNgoId);

  const matchedRequests = requests.filter(r => {
    if (r.matched_ngo_id !== selectedNgoId) return false;
    if (searchSector && searchSector !== 'all') {
      if (!r.category.toLowerCase().includes(searchSector.toLowerCase())) return false;
    }
    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      const mCamp = (r.camp_name || '').toLowerCase().includes(q);
      const mCat = (r.category || '').toLowerCase().includes(q);
      const mStatus = (r.status || '').toLowerCase().includes(q);
      const mNotes = (r.notes || '').toLowerCase().includes(q);
      if (!mCamp && !mCat && !mStatus && !mNotes) return false;
    }
    return true;
  });

  const filteredResources = resources.filter(res => {
    if (searchSector && searchSector !== 'all') {
      if (!res.category.toLowerCase().includes(searchSector.toLowerCase())) return false;
    }
    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      const mCat = (res.category || '').toLowerCase().includes(q);
      const mUnit = (res.unit || '').toLowerCase().includes(q);
      if (!mCat && !mUnit) return false;
    }
    return true;
  });

  const filteredBudgetRequests = budgetRequests.filter(br => {
    if (searchSector && searchSector !== 'all') {
      if (!br.request_type.toLowerCase().includes(searchSector.toLowerCase())) return false;
    }
    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      const mType = (br.request_type || '').toLowerCase().includes(q);
      const mReason = (br.reason || '').toLowerCase().includes(q);
      const mStatus = (br.status || '').toLowerCase().includes(q);
      if (!mType && !mReason && !mStatus) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* 1. Deep Navy Hero Banner (India.gov.in style) */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-8 md:p-12 relative overflow-hidden rounded-b-3xl shadow-md border-b-4 border-red-600">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <div className="relative z-10 max-w-4xl space-y-3">
          <span className="bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-sm tracking-widest uppercase">
            Nodal Agency Panel
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            NGO Logistics & Supply Dispatch Portal
          </h2>
          <p className="text-slate-300 text-xs md:text-sm font-medium leading-relaxed max-w-2xl">
            Verified non-governmental organizations manage real-time inventory stocks, process smart-matched local camp requisitions, and update transport dispatches.
          </p>
          
          <div className="flex items-center gap-2 pt-2 text-[11px] font-bold text-slate-400">
            <UserCheck className="w-3.5 h-3.5 text-red-500" />
            <span>Assigned Unit:</span>
            <span className="text-white uppercase">{selectedNgo?.org_name || 'Red Cross Logistics'}</span>
          </div>
        </div>
      </div>

      {/* 2. Floating Metric Counter Bar */}
      <div className="max-w-6xl mx-auto -mt-10 relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 px-4">
        
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-md text-center hover:shadow-lg transition-all hover-pop">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600 mb-2">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <span className="text-2xl font-extrabold text-slate-900">{selectedNgo?.org_name ? 1 : ngos.length}</span>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Active Nodal Agencies</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-md text-center hover:shadow-lg transition-all hover-pop">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto text-emerald-600 mb-2">
            <PackageCheck className="w-5 h-5" />
          </div>
          <span className="text-2xl font-extrabold text-slate-900">{resources.length}</span>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Inventory Categories</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-md text-center hover:shadow-lg transition-all hover-pop">
          <div className="w-9 h-9 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center mx-auto text-red-600 mb-2">
            <Activity className="w-5 h-5" />
          </div>
          <span className="text-2xl font-extrabold text-slate-900">{matchedRequests.length}</span>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Assigned Matches</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-md text-center hover:shadow-lg transition-all hover-pop">
          <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto text-amber-600 mb-2">
            <Truck className="w-5 h-5" />
          </div>
          <span className="text-2xl font-extrabold text-slate-900">{matchedRequests.filter(r => r.status === 'Dispatched').length}</span>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Active Dispatches</p>
        </div>

      </div>

      {/* Main Grid Content */}
      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Inventory Stock Manager */}
        <div className="lg:col-span-1 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between flex-wrap gap-2">
            <h3 className="border-b-2 border-red-600 inline-block pb-1 text-base font-bold text-slate-900">
              Agency Inventory Stock
            </h3>
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => setShowBudgetModal(true)}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] px-2.5 py-1 rounded tracking-wider uppercase cursor-pointer flex items-center gap-1 shadow-xs"
              >
                ⚡ Request Budget / Aid
              </button>
              <button
                onClick={() => setShowCreateCampModal(true)}
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] px-2.5 py-1 rounded tracking-wider uppercase cursor-pointer"
              >
                + Register Camp
              </button>
            </div>
          </div>

          {/* Available Inventory Grid */}
          <div className="space-y-2">
            {filteredResources.length === 0 ? (
              <p className="text-xs font-semibold text-slate-500 py-6 text-center">No matching inventory stock found.</p>
            ) : (
              filteredResources.map((res) => {
                const isLow = res.quantity < 300;
                return (
                  <div key={res.id} className={`p-3 rounded-lg border flex items-center justify-between shadow-2xs hover-pop ${
                    isLow ? 'bg-amber-50/60 border-amber-300' : 'bg-slate-50/50 border-slate-200'
                  }`}>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">
                        {res.category.includes('water') ? '💧' : res.category.includes('medicine') ? '💊' : res.category.includes('food') ? '🍲' : '📦'}
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h5 className="text-xs font-bold text-slate-900 capitalize">{res.category.replace('_', ' ')}</h5>
                          {isLow && (
                            <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold uppercase animate-pulse">
                              Low Stock
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">Operational Unit</span>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded border ${
                      isLow ? 'text-amber-800 bg-amber-100 border-amber-200' : 'text-indigo-700 bg-indigo-50 border-indigo-150'
                    }`}>
                      {res.quantity} {res.unit}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Add Stock Form */}
          <form onSubmit={handleAddStock} className="space-y-3 pt-4 border-t border-slate-100 text-xs">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Update / Add Stock Quantity</h4>
            
            <div>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none cursor-pointer"
              >
                <option value="drinking_water">💧 Drinking Water</option>
                <option value="medicine">💊 Medicines & First Aid</option>
                <option value="food">🍲 Food & Dry Rations</option>
                <option value="blankets">🛋️ Blankets & Bedding</option>
                <option value="shelter">⛺ Shelter Tents</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none"
                placeholder="Qty"
                required
              />
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none"
                placeholder="Unit"
                required
              />
            </div>

            <button
              type="submit"
              disabled={addingResource}
              className="w-full px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer uppercase"
            >
              {addingResource ? 'Updating...' : 'Register / Add Stock'}
            </button>
          </form>

        </div>

        {/* Right Column: High-density Matching Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="border-b-2 border-red-600 inline-block pb-1 text-base font-bold text-slate-900">
                  Assigned Camp Requisition Logs
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 font-medium">Ranked by Resource Match Score (RMS)</p>
              </div>
              <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-700 border border-slate-200">
                {matchedRequests.length} Matches Assigned
              </span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-500 font-medium">Loading matched requisitions...</div>
            ) : matchedRequests.length === 0 ? (
              <div className="py-12 text-center text-slate-500 bg-slate-50 border border-dashed border-slate-200 rounded-2xl font-medium">
                No active camp requisitions assigned to this NGO unit.
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-2xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="p-3.5">Camp / Location</th>
                      <th className="p-3.5">Item Requested</th>
                      <th className="p-3.5 text-center">Score</th>
                      <th className="p-3.5">Current Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700 font-medium">
                    {matchedRequests.map((req) => (
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
                        <td className="p-3.5 text-center">
                          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded">
                            87% RMS
                          </span>
                        </td>
                        <td className="p-3.5">
                          <div className="space-y-1">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              req.priority === 'Critical' ? 'bg-red-50 text-red-700 border border-red-200 animate-pulse' : 'bg-amber-50 text-amber-700'
                            }`}>
                              {req.priority?.toUpperCase()}
                            </span>
                            <span className="block text-[10px] text-slate-500 font-semibold">{req.status}</span>
                          </div>
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            {req.status === 'Matched' && (
                              <button
                                onClick={() => handleAcceptRequest(req.id)}
                                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] rounded transition-all cursor-pointer uppercase"
                              >
                                Accept Requisition
                              </button>
                            )}

                            {req.status === 'Accepted' && (
                              <button
                                onClick={() => handleStatusUpdate(req.id, 'Dispatched')}
                                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] rounded transition-all cursor-pointer uppercase"
                              >
                                Dispatch Supply
                              </button>
                            )}

                            {req.status === 'Dispatched' && (
                              <button
                                onClick={() => handleStatusUpdate(req.id, 'Delivered')}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded transition-all cursor-pointer uppercase"
                              >
                                Mark Delivered
                              </button>
                            )}

                            {req.status === 'Delivered' && (
                              <span className="text-emerald-700 font-bold text-[10px] uppercase">
                                ✓ Supply Completed
                              </span>
                            )}

                            {['Matched', 'Accepted', 'Dispatched', 'Delivered'].includes(req.status) && (
                              <button
                                onClick={() => setSelectedReqForRouteModal(req)}
                                className="px-2.5 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-[10px] rounded transition-all cursor-pointer uppercase shadow-2xs flex items-center gap-1"
                              >
                                🚚 Track Route
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Budget & Aid Requisitions Section */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="border-b-2 border-amber-600 inline-block pb-1 text-base font-bold text-slate-900">
                  Authority Budget & Supply Aid Requisitions
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 font-medium">Emergency requests submitted to District Authorities when inventory runs low</p>
              </div>
              <button
                onClick={() => setShowBudgetModal(true)}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] rounded uppercase tracking-wider cursor-pointer"
              >
                + New Aid Request
              </button>
            </div>

            {filteredBudgetRequests.length === 0 ? (
              <div className="py-8 text-center text-slate-500 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-xs font-medium">
                No matching budget or supply aid requisitions found.
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-2xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="p-3">Requested Aid Type</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Inventory Snapshot Sent</th>
                      <th className="p-3">Status & Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700 font-medium">
                    {filteredBudgetRequests.map((br) => (
                      <tr key={br.id} className="hover:bg-slate-50/50">
                        <td className="p-3 font-bold text-slate-900">{br.request_type}</td>
                        <td className="p-3 font-bold text-indigo-700">
                          {br.unit === 'INR' ? `₹${br.requested_amount.toLocaleString()}` : `${br.requested_amount} ${br.unit}`}
                        </td>
                        <td className="p-3 text-[10px] text-slate-500 max-w-xs truncate font-mono">
                          {br.current_supplies_snapshot || 'N/A'}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            br.status === 'Approved' || br.status === 'Disbursed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : br.status === 'Rejected'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {br.status?.toUpperCase()}
                          </span>
                          {br.approved_amount && (
                            <span className="block text-[10px] text-slate-600 font-semibold mt-0.5">
                              Approved: {br.unit === 'INR' ? `₹${br.approved_amount.toLocaleString()}` : `${br.approved_amount} ${br.unit}`}
                            </span>
                          )}
                          {br.authority_notes && (
                            <span className="block text-[9px] text-slate-400 italic mt-0.5">
                              Note: {br.authority_notes}
                            </span>
                          )}
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

      {/* Create Camp Modal */}
      {showCreateCampModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-3xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>⛺ Register New Relief Area Camp</span>
              </h3>
              <button onClick={() => setShowCreateCampModal(false)} className="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer">✕ Close</button>
            </div>

            <form onSubmit={handleCreateCampSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Relief Area Camp Name:</label>
                <input
                  type="text"
                  value={campAreaName}
                  onChange={(e) => setCampAreaName(e.target.value)}
                  placeholder="e.g. North Zone Flood Shelter Camp #5"
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Assigned Manager Name:</label>
                  <input
                    type="text"
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    placeholder="e.g. Rajesh Kumar"
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Manager Login Email:</label>
                  <input
                    type="email"
                    value={managerEmail}
                    onChange={(e) => setManagerEmail(e.target.value)}
                    placeholder="manager@relieflink.org"
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Password:</label>
                  <input
                    type="text"
                    value={managerPassword}
                    onChange={(e) => setManagerPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Max Capacity:</label>
                  <input
                    type="number"
                    value={campCapacity}
                    onChange={(e) => setCampCapacity(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Population:</label>
                  <input
                    type="number"
                    value={campPopulation}
                    onChange={(e) => setCampPopulation(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                    required
                  />
                </div>
              </div>

              {createCampMsg && (
                <p className={`p-2.5 rounded-xl text-xs font-semibold ${createCampMsg.includes('✅') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                  {createCampMsg}
                </p>
              )}

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateCampModal(false)}
                  className="px-4 py-2.5 bg-white/80 border border-slate-200/80 hover:bg-white text-slate-700 font-semibold text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingCamp}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  {creatingCamp ? 'Registering...' : 'Register Relief Area Camp'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Emergency Budget & Supply Aid Request Modal */}
      {showBudgetModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-3xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>⚡ Request Budget / Supply Aid from Authorities</span>
              </h3>
              <button onClick={() => setShowBudgetModal(false)} className="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer">✕ Close</button>
            </div>

            <form onSubmit={handleCreateBudgetSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Requested Requisition Type:</label>
                <select
                  value={bRequestType}
                  onChange={(e) => {
                    const val = e.target.value;
                    setBRequestType(val);
                    if (val === 'Financial Grant (INR)') setBUnit('INR');
                    else if (val.includes('Food')) setBUnit('Packets');
                    else if (val.includes('Medicine')) setBUnit('Kits');
                    else if (val.includes('Shelter')) setBUnit('Tents');
                    else setBUnit('Units');
                  }}
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 cursor-pointer"
                >
                  <option value="Financial Grant (INR)">💰 Financial Grant (INR)</option>
                  <option value="Food Rations">🍲 Food Rations Replenishment</option>
                  <option value="Medicine Kits">💊 Medical Kits Replenishment</option>
                  <option value="Shelter Tents">⛺ Shelter Tents Replenishment</option>
                  <option value="Blankets & Bedding">🛋️ Blankets & Bedding</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Amount Needed:</label>
                  <input
                    type="number"
                    min="1"
                    value={bRequestedAmount}
                    onChange={(e) => setBRequestedAmount(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Unit:</label>
                  <input
                    type="text"
                    value={bUnit}
                    onChange={(e) => setBUnit(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Inventory Snapshot automatically attached:</label>
                <div className="p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-[10px] text-slate-700 font-mono">
                  {resources.map(r => `${r.category.replace('_', ' ')}: ${r.quantity} ${r.unit}`).join(', ') || 'No stock listed'}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Urgency & Operation Reason:</label>
                <textarea
                  rows="2"
                  value={bReason}
                  onChange={(e) => setBReason(e.target.value)}
                  placeholder="Explain why stock is depleting and why funds/supplies are required..."
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
                  required
                />
              </div>

              {budgetMsg && (
                <p className={`p-2.5 rounded-xl text-xs font-semibold ${budgetMsg.includes('✅') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                  {budgetMsg}
                </p>
              )}

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBudgetModal(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingBudget}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl cursor-pointer"
                >
                  {submittingBudget ? 'Submitting...' : 'Send Aid Requisition to Authorities'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Live Supply Transport Route Tracker Modal */}
      {selectedReqForRouteModal && (
        <SupplyRouteModal
          request={selectedReqForRouteModal}
          camp={camps.find(c => c.id === selectedReqForRouteModal.camp_id)}
          ngo={selectedNgo}
          onClose={() => setSelectedReqForRouteModal(null)}
        />
      )}

    </div>
  );
}
