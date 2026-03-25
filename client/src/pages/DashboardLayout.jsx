import React, { useState } from 'react';
import api from '../services/api';

const DashboardLayout = ({
  title,
  user,
  sidebarItems,
  activeTab,
  onTabChange,
  onLogout,
  children
}) => {
  // Password Change State
  const [pwDialogOpen, setPwDialogOpen] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  const handleChangePassword = async () => {
    setPwError(''); setPwSuccess('');
    if (!pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmPassword) { setPwError('All fields are required.'); return; }
    if (pwForm.newPassword !== pwForm.confirmPassword) { setPwError('New passwords do not match.'); return; }
    if (pwForm.newPassword.length < 6) { setPwError('New password must be at least 6 characters.'); return; }
    setPwLoading(true);
    try {
      await api.post('/auth/change-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      setPwSuccess('Password changed successfully!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPwError(err.response?.data?.message || 'Failed to change password.');
    } finally { setPwLoading(false); }
  };

  return (
    <div className="min-h-screen flex font-sans" style={{ background: '#eef1f7' }}>

      {/* Sidebar — Dark Navy */}
      <aside
        className="w-60 fixed h-full z-20 hidden md:flex flex-col"
        style={{ background: '#1a1f2e' }}
      >
        {/* Logo */}
        <div
          className="h-16 flex items-center px-5 gap-3"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #6c47ff, #9c74ff)' }}
          >
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">PlaceIQ</p>
            <p className="text-xs leading-tight" style={{ color: '#8b92a5' }}>
              {user?.role === 'STAFF' ? 'STAFF PORTAL' : 'PLACEMENT PORTAL'}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          <p
            className="text-xs font-semibold px-3 mb-3 uppercase"
            style={{ color: '#8b92a5', letterSpacing: '0.08em', fontSize: '10px' }}
          >
            Menu
          </p>
          {sidebarItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className="w-full flex items-center px-3 py-2.5 text-sm rounded-lg transition-all duration-150"
                style={
                  isActive
                    ? { background: '#6c47ff', color: '#ffffff', fontWeight: 600 }
                    : { color: '#8b92a5', fontWeight: 400 }
                }
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                  if (!isActive) e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                  if (!isActive) e.currentTarget.style.color = '#8b92a5';
                }}
              >
                <span className="mr-3 flex-shrink-0" style={{ color: isActive ? '#ffffff' : '#8b92a5' }}>
                  {item.icon}
                </span>
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Sign Out */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '12px' }}>
          <button
            onClick={onLogout}
            className="w-full flex items-center px-3 py-2.5 text-sm rounded-lg transition-all duration-150"
            style={{ color: '#8b92a5' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#ffffff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8b92a5'; }}
          >
            <svg className="w-4 h-4 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:ml-60 min-h-screen">
        {/* Top Navbar */}
        <header
          className="h-16 flex items-center justify-between px-6 sticky top-0 z-10"
          style={{ background: '#ffffff', borderBottom: '1px solid #e2e6ea' }}
        >
          <h1 className="text-base font-semibold" style={{ color: '#111827' }}>{title}</h1>
          <div className="flex items-center gap-3">
            {/* Bell Icon */}
            <button
              className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
              style={{ color: '#6b7280' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f3f4f6'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            {/* User Info */}
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium" style={{ color: '#111827' }}>{user?.name || 'User'}</p>
              <p className="text-xs" style={{ color: '#6b7280' }}>{user?.role || 'Staff'}</p>
            </div>
            {/* Avatar — click to change password */}
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #6c47ff, #9c74ff)', color: '#ffffff' }}
              onClick={() => setPwDialogOpen(true)}
              title="Change Password"
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Password Change Dialog */}
      {pwDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 shadow-xl">
            <h3 className="text-lg font-bold mb-4" style={{ color: '#1a1f2e' }}>Change Password</h3>
            {pwError && <p className="text-sm text-red-600 mb-3 bg-red-50 p-2 rounded">{pwError}</p>}
            {pwSuccess && <p className="text-sm text-green-600 mb-3 bg-green-50 p-2 rounded">{pwSuccess}</p>}
            <div className="flex flex-col gap-3 mb-4">
              <input type="password" placeholder="Current Password" className="p-2 border rounded text-sm" value={pwForm.currentPassword} onChange={e => setPwForm(f => ({...f, currentPassword: e.target.value}))} />
              <input type="password" placeholder="New Password" className="p-2 border rounded text-sm" value={pwForm.newPassword} onChange={e => setPwForm(f => ({...f, newPassword: e.target.value}))} />
              <input type="password" placeholder="Confirm New Password" className="p-2 border rounded text-sm" value={pwForm.confirmPassword} onChange={e => setPwForm(f => ({...f, confirmPassword: e.target.value}))} />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => { setPwDialogOpen(false); setPwError(''); setPwSuccess(''); }} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded text-sm font-medium">Cancel</button>
              <button onClick={handleChangePassword} disabled={pwLoading} className="px-4 py-2 text-white rounded text-sm font-semibold" style={{ background: '#6c47ff' }}>{pwLoading ? 'Changing...' : 'Change Password'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;