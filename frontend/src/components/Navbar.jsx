import React, { useState } from 'react';
import { Shield, Bell, LogOut, Search, Volume2, Type, Globe, Compass } from 'lucide-react';

export default function Navbar({ 
  currentUser, 
  onLogout, 
  unreadNotifCount, 
  toggleNotifDrawer,
  searchQuery = '',
  setSearchQuery = () => {},
  searchSector = 'all',
  setSearchSector = () => {}
}) {

  return (
    <header className="w-full flex flex-col z-50 bg-white">
      
      {/* 1. Accessibility Top Bar */}
      <div className="bg-slate-900 text-slate-300 text-[11px] py-2 px-6 flex justify-between items-center border-b border-slate-800">
        <div className="flex items-center space-x-3 font-semibold tracking-wider">
          <span className="bg-red-600 text-white px-2 py-0.5 rounded-sm font-bold text-[9px]">GOVT OF INDIA</span>
          <span>NATIONAL DISASTER RELIEF PORTAL</span>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="hover:text-white flex items-center gap-1 cursor-pointer">
            <Volume2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Screen Reader Access</span>
          </button>
          <span>|</span>
          <div className="flex items-center space-x-1.5 font-bold">
            <button className="hover:text-white cursor-pointer px-1">A-</button>
            <button className="hover:text-white cursor-pointer px-1 bg-slate-800 text-white rounded">A</button>
            <button className="hover:text-white cursor-pointer px-1">A+</button>
          </div>
          <span>|</span>
          <button className="hover:text-white flex items-center gap-1 cursor-pointer">
            <Globe className="w-3.5 h-3.5" />
            <span>English</span>
          </button>
        </div>
      </div>

      {/* 2. Main Navigation Header */}
      <div className="bg-white border-b border-slate-200 py-4 px-6 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-4">
        
        {/* Brand Section */}
        <div className="flex items-center space-x-3.5 shrink-0">
          <img
            src="/relieflink-logo.png"
            alt="ReliefLink Seal Logo"
            className="w-12 h-12 object-contain rounded-full border border-slate-200 shadow-sm"
          />
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-extrabold tracking-tight text-[#0B2545]">ReliefLink</span>
              <span className="text-xs font-extrabold text-[#F58220] bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-md uppercase">
                Official Portal
              </span>
              <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md uppercase hidden sm:inline">
                Government Verified
              </span>
            </div>
            <span className="text-xs font-semibold text-slate-500 block">
              Ministry of Disaster Management & Resource Coordination
            </span>
          </div>
        </div>

        {/* Center Search Bar & Filter */}
        <div className="w-full max-w-lg flex items-center bg-slate-50 border border-slate-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-red-500/20 focus-within:border-red-600 transition-all">
          <select 
            value={searchSector}
            onChange={(e) => setSearchSector(e.target.value)}
            className="bg-transparent border-r border-slate-200 text-xs text-slate-600 font-bold px-3 py-2.5 focus:outline-none cursor-pointer"
          >
            <option value="all">All Sectors</option>
            <option value="water">💧 Water Supply</option>
            <option value="medicine">💊 Medical Relief</option>
            <option value="food">🍲 Rations & Food</option>
            <option value="shelter">⛺ Shelter & Tents</option>
            <option value="blankets">🛋️ Blankets & Bedding</option>
          </select>
          <input 
            type="text" 
            placeholder="Search demands, camps, NGOs, dispatches..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-grow bg-transparent px-3 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-slate-400 hover:text-slate-600 px-2 text-xs font-bold cursor-pointer"
              title="Clear search"
            >
              ✕
            </button>
          )}
          <button className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2.5 text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0">
            <Search className="w-3.5 h-3.5" />
            <span>Search</span>
          </button>
        </div>

        {/* User Info & Actions Section */}
        {currentUser && (
          <div className="flex items-center space-x-3 shrink-0">
            <div className="flex items-center space-x-2.5 px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span>{currentUser.displayName}</span>
              <span className="text-slate-400 capitalize">({currentUser.role})</span>
            </div>

            {/* Notification Drawer Trigger */}
            <button
              onClick={toggleNotifDrawer}
              className="relative p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs shadow-2xs transition-all cursor-pointer flex items-center justify-center"
              title="Alert Notifications Feed"
            >
              <Bell className="w-4 h-4 text-slate-700" />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                  {unreadNotifCount}
                </span>
              )}
            </button>

            {/* Log Out */}
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center space-x-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        )}

      </div>

    </header>
  );
}
