import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import CampDashboard from './components/CampDashboard';
import NgoDashboard from './components/NgoDashboard';
import AdminDashboard from './components/AdminDashboard';
import NotificationCenter from './components/NotificationCenter';
import { api } from './api';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('relieflink_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [notifications, setNotifications] = useState([]);
  const [notifDrawerOpen, setNotifDrawerOpen] = useState(false);

  // Global Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSector, setSearchSector] = useState('all');

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const list = await api.getNotifications();
      setNotifications(list);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  const handleLoginSuccess = (userSession) => {
    setCurrentUser(userSession);
    localStorage.setItem('relieflink_user', JSON.stringify(userSession));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('relieflink_user');
  };

  const handleMarkRead = async (id) => {
    try {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      await api.markNotificationRead(id);
      fetchNotifications();
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    if (unread.length === 0) return;
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    for (const n of unread) {
      try {
        await api.markNotificationRead(n.id);
      } catch (err) {
        console.error("Failed to mark notification read:", err);
      }
    }
  };

  const handleToggleNotifDrawer = () => {
    if (!notifDrawerOpen) {
      handleMarkAllRead();
    }
    setNotifDrawerOpen(!notifDrawerOpen);
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (!currentUser) {
    return <AuthModal onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#F4F3FF] font-sans text-slate-900 antialiased flex flex-col justify-between selection:bg-red-600 selection:text-white">
      
      <div>
        {/* Government Official Top Header & Navbar */}
        <Navbar
          currentUser={currentUser}
          onLogout={handleLogout}
          unreadNotifCount={unreadCount}
          toggleNotifDrawer={handleToggleNotifDrawer}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchSector={searchSector}
          setSearchSector={setSearchSector}
        />

        {/* Live Notification Drawer */}
        <NotificationCenter
          isOpen={notifDrawerOpen}
          onClose={() => setNotifDrawerOpen(false)}
          notifications={notifications}
          onMarkRead={handleMarkRead}
          onMarkAllRead={handleMarkAllRead}
        />

        {/* Main Government Portal Content Area */}
        <main className="w-full">
          {currentUser.role === 'camp' && (
            <CampDashboard
              currentUser={currentUser}
              onRefreshNeeded={fetchNotifications}
              searchQuery={searchQuery}
              searchSector={searchSector}
            />
          )}

          {currentUser.role === 'ngo' && (
            <NgoDashboard
              currentUser={currentUser}
              onRefreshNeeded={fetchNotifications}
              searchQuery={searchQuery}
              searchSector={searchSector}
            />
          )}

          {currentUser.role === 'admin' && (
            <AdminDashboard
              currentUser={currentUser}
              searchQuery={searchQuery}
              searchSector={searchSector}
            />
          )}
        </main>
      </div>

      {/* Official Government Portal Footer */}
      <footer className="w-full bg-slate-900 text-slate-400 mt-12 border-t-4 border-red-600">
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8 text-xs">
          <div className="space-y-3">
            <h4 className="text-white font-extrabold tracking-wider text-sm uppercase">ReliefLink Portal</h4>
            <p className="leading-relaxed">
              Designed as a central disaster response system to smart-match and allocate resource supplies across relief camps, verified NGOs, and District Command Centers.
            </p>
          </div>
          <div className="space-y-3">
            <h4 className="text-white font-extrabold tracking-wider text-sm uppercase">Emergency Contact Info</h4>
            <p className="leading-relaxed">
              National Disaster Response Force (NDRF): <strong>1078</strong><br />
              Central Relief Coordination Desk: <strong>+91-11-23438019</strong><br />
              Email Support: <strong>desk.relief@gov.in</strong>
            </p>
          </div>
          <div className="space-y-3">
            <h4 className="text-white font-extrabold tracking-wider text-sm uppercase">Compliance & Audits</h4>
            <p className="leading-relaxed">
              All transactions, priority overrides, and supply line dispatches are cryptographically verified and logged for public administrative review.
            </p>
          </div>
        </div>
        
        <div className="bg-slate-950 py-4 px-6 text-center text-[10px] text-slate-500 border-t border-slate-800">
          © 2026 National Disaster Relief Portal. Government of India. All rights reserved. Developed by Vigneshwaran K.
        </div>
      </footer>

    </div>
  );
}
