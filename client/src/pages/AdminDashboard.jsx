import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import {
  Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Chip, CircularProgress, Alert, Avatar, Tooltip
} from '@mui/material';
import {
  People as PeopleIcon,
  Business as BusinessIcon,
  Work as WorkIcon,
  Assessment as StatsIcon,
  EmojiEvents as ActivityIcon,
  CheckCircle as CheckIcon,
  Cancel as RejectIcon,
  ExitToApp as LogoutIcon,
  PersonOff as DeactivateIcon,
  PersonAdd as ActivateIcon
} from '@mui/icons-material';

// ── Stat Card Component ───────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, color, subLabel }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-start gap-4 hover:shadow-md transition-shadow`}>
    <div className={`p-3 rounded-xl ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="text-3xl font-bold text-gray-800 mt-0.5">{value ?? '—'}</p>
      {subLabel && <p className="text-xs text-gray-400 mt-1">{subLabel}</p>}
    </div>
  </div>
);

// ── Status Badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => (
  <Chip
    label={status}
    size="small"
    sx={{
      fontWeight: 600,
      fontSize: '0.7rem',
      bgcolor: status === 'ACTIVE' ? '#dcfce7' : '#fee2e2',
      color: status === 'ACTIVE' ? '#166534' : '#991b1b',
    }}
  />
);

// ─────────────────────────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [staffData, setStaffData] = useState({ data: [], pagination: { page: 1, totalPages: 1 } });
  const [studentData, setStudentData] = useState({ data: [], pagination: { page: 1, totalPages: 1 } });
  const [activityData, setActivityData] = useState({ data: [], pagination: { page: 1, totalPages: 1 } });
  const [loading, setLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState({ text: '', severity: 'success' });
  const [staffSearch, setStaffSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [companySearch, setCompanySearch] = useState('');

  const [staffPage, setStaffPage] = useState(1);
  const [studentPage, setStudentPage] = useState(1);
  const [activityPage, setActivityPage] = useState(1);
  const [companyPage, setCompanyPage] = useState(1);

  const [companyData, setCompanyData] = useState({ data: [], pagination: { page: 1, totalPages: 1 } });
  const [selectedCompany, setSelectedCompany] = useState(null); // { company, roles }
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [roleAnalytics, setRoleAnalytics] = useState({}); // { roleId: { stats, students, loading } }

  // Modals/Dialogs
  const [proofModal, setProofModal] = useState({ open: false, url: '' });
  const [rejectDialog, setRejectDialog] = useState({ open: false, activityId: null, reason: '' });

  // Password Change
  const [pwDialogOpen, setPwDialogOpen] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const showMsg = (text, severity = 'success') => { 
    setActionMsg({ text, severity }); 
    setTimeout(() => setActionMsg({ text: '', severity: 'success' }), 3500); 
  };

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data);
    } catch (err) { console.error(err); }
  }, []);

  const fetchStaff = useCallback(async (page = staffPage) => {
    setLoading(true);
    try { 
      const res = await api.get(`/admin/staff?page=${page}&search=${staffSearch}`); 
      setStaffData(res.data);
      setStaffPage(res.data.pagination.page);
    }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [staffSearch, staffPage]);

  const fetchStudents = useCallback(async (page = studentPage) => {
    setLoading(true);
    try { 
      const res = await api.get(`/admin/students?page=${page}&search=${studentSearch}`); 
      setStudentData(res.data);
      setStudentPage(res.data.pagination.page);
    }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [studentSearch, studentPage]);

  const fetchActivityPoints = useCallback(async (page = activityPage) => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/activity-points?page=${page}`);
      setActivityData(res.data);
      setActivityPage(res.data.pagination.page);
    }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [activityPage]);

  const fetchRoleAnalytics = useCallback(async (roleId) => {
    setRoleAnalytics(prev => ({ ...prev, [roleId]: { loading: true } }));
    try {
      const statsRes = await api.get(`/admin/job-roles/analytics/${roleId}`);
      const studentsRes = await api.get(`/admin/job-roles/offered-students/${roleId}`);
      setRoleAnalytics(prev => ({
        ...prev,
        [roleId]: { stats: statsRes.data, students: studentsRes.data, loading: false }
      }));
    } catch (err) {
      console.error(err);
      setRoleAnalytics(prev => ({ ...prev, [roleId]: { loading: false, error: true } }));
    }
  }, []);

  const fetchCompanies = useCallback(async (page = companyPage) => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/companies?page=${page}&search=${companySearch}`);
      setCompanyData(res.data);
      setCompanyPage(res.data.pagination.page);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [companySearch, companyPage]);

  const fetchCompanyDetails = useCallback(async (compId) => {
    try {
      const res = await api.get(`/admin/companies/detail/${compId}`);
      setSelectedCompany(res.data);
      if (res.data.roles && res.data.roles.length > 0) {
        const firstRoleId = res.data.roles[0].job_role_id;
        setSelectedRoleId(firstRoleId);
        fetchRoleAnalytics(firstRoleId);
      }
    } catch (err) { console.error(err); }
  }, [fetchRoleAnalytics]);


  useEffect(() => { fetchStats(); }, [fetchStats]);
  
  // Fetch data when tab changes or search/page changes (with debounce for search)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (activeTab === 'staff') fetchStaff(staffPage);
      else if (activeTab === 'students') fetchStudents(studentPage);
      else if (activeTab === 'activity') fetchActivityPoints(activityPage);
      else if (activeTab === 'companies') {
        if (!selectedCompany) fetchCompanies(companyPage);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [activeTab, staffSearch, studentSearch, companySearch, staffPage, studentPage, activityPage, companyPage, fetchStaff, fetchStudents, fetchActivityPoints, fetchCompanies, selectedCompany]);

  // Reset pages when search changes
  useEffect(() => { setStaffPage(1); }, [staffSearch]);
  useEffect(() => { setStudentPage(1); }, [studentSearch]);
  useEffect(() => { setCompanyPage(1); }, [companySearch]);

  const handleStaffStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.post('/admin/staff/status', { userId, status: newStatus });
      showMsg(`Staff account ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'} successfully.`);
      fetchStaff();
      fetchStats();
    } catch (err) { showMsg(err.response?.data?.message || 'Action failed.'); }
  };

  const handleStudentStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.post('/admin/students/status', { userId, status: newStatus });
      showMsg(`Student account ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'}.`);
      fetchStudents();
    } catch (err) { showMsg(err.response?.data?.message || 'Action failed.'); }
  };

  const handleVerifyActivity = async (activityId, approve, rejectionReason = '') => {
    try {
      await api.post('/admin/activity-points/verify', { activityId, approve, rejectionReason });
      showMsg(approve ? 'Activity points approved!' : 'Entry rejected.');
      setActivityData(prev => ({
        ...prev,
        data: prev.data.filter(p => p.activity_id !== activityId)
      }));
      setRejectDialog({ open: false, activityId: null, reason: '' });
      fetchStats();
    } catch (err) { showMsg('Action failed.', 'error'); }
  };

  const handleLogout = () => { logout(); navigate('/'); };

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
    } catch (err) { setPwError(err.response?.data?.message || 'Failed.'); }
    finally { setPwLoading(false); }
  };

  // ── Nav class helper ──
  const navClass = (tab) => activeTab === tab
    ? 'w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-lg transition-all duration-150 text-white'
    : 'w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150';

  const navStyle = (tab) => activeTab === tab
    ? { background: '#6c47ff', color: '#ffffff' }
    : { color: '#8b92a5' };

  const renderLoader = () => (
    <div className="flex justify-center py-16"><CircularProgress /></div>
  );

  // ── Overview Tab ────────────────────────────────────────────────────────────
  const renderOverview = () => (
    <div>
      <h2 className="text-2xl font-bold mb-6" style={{ color: '#1a1f2e' }}>Overview</h2>
      {!stats ? renderLoader() : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <StatCard
              icon={<PeopleIcon sx={{ color: '#4f46e5' }} />}
              label="Total Students"
              value={stats.total_students}
              color="bg-indigo-50"
            />
            <StatCard
              icon={<WorkIcon sx={{ color: '#0891b2' }} />}
              label="Placement Staff"
              value={stats.total_staff}
              color="bg-cyan-50"
            />
            <StatCard
              icon={<BusinessIcon sx={{ color: '#059669' }} />}
              label="Companies"
              value={stats.total_companies}
              subLabel={`${stats.total_drives} active drives`}
              color="bg-emerald-50"
            />
            <StatCard
              icon={<StatsIcon sx={{ color: '#d97706' }} />}
              label="Placement Rate"
              value={`${stats.placement_rate}%`}
              subLabel={`${stats.offered_count} students placed`}
              color="bg-amber-50"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <StatCard
              icon={<StatsIcon sx={{ color: '#7c3aed' }} />}
              label="Total Applications"
              value={stats.total_applications}
              color="bg-violet-50"
            />
            <StatCard
              icon={<ActivityIcon sx={{ color: '#dc2626' }} />}
              label="Pending Activity Points"
              value={stats.pending_activity_points}
              subLabel="Awaiting verification"
              color="bg-red-50"
            />
          </div>
        </>
      )}
    </div>
  );

  // ── Staff Tab ───────────────────────────────────────────────────────────────
  const renderStaff = () => (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold" style={{ color: '#1a1f2e' }}>Placement Staff</h2>
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search staff..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={staffSearch}
            onChange={(e) => setStaffSearch(e.target.value)}
          />
          <svg className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
      {loading ? renderLoader() : (
        <>
        <TableContainer component={Paper} elevation={0} className="border border-gray-200 rounded-xl overflow-hidden">
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f9fafb' }}>
                <TableCell><span className="font-semibold text-gray-600 text-sm">Name</span></TableCell>
                <TableCell><span className="font-semibold text-gray-600 text-sm">Email</span></TableCell>
                <TableCell><span className="font-semibold text-gray-600 text-sm">Designation</span></TableCell>
                <TableCell><span className="font-semibold text-gray-600 text-sm">Status</span></TableCell>
                <TableCell><span className="font-semibold text-gray-600 text-sm">Action</span></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {staffData.data.map(s => (
                <TableRow key={s.user_id} hover>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar sx={{ width: 32, height: 32, bgcolor: '#818cf8', fontSize: '0.8rem' }}>
                        {(s.name || s.email)?.[0]?.toUpperCase()}
                      </Avatar>
                      <span className="font-medium text-gray-800">{s.name || '—'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600 text-sm">{s.email}</TableCell>
                  <TableCell className="text-gray-600 text-sm">{s.designation || '—'}</TableCell>
                  <TableCell><StatusBadge status={s.status} /></TableCell>
                  <TableCell>
                    <Tooltip title={s.status === 'ACTIVE' ? 'Deactivate account' : 'Activate account'}>
                      <Button
                        size="small"
                        variant="outlined"
                        color={s.status === 'ACTIVE' ? 'error' : 'success'}
                        startIcon={s.status === 'ACTIVE' ? <DeactivateIcon /> : <ActivateIcon />}
                        onClick={() => handleStaffStatus(s.user_id, s.status)}
                        sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                      >
                        {s.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      </Button>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {staffData.data.length === 0 && (
                <TableRow><TableCell colSpan={5} align="center" className="text-gray-400 py-10">No staff found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <div className="flex items-center justify-between mt-4 px-1">
          <p className="text-xs text-gray-500">Page {staffData.pagination.page} of {staffData.pagination.totalPages} ({staffData.pagination.total} total)</p>
          <div className="flex gap-2">
            <button onClick={() => setStaffPage(prev => prev - 1)} disabled={staffData.pagination.page <= 1} className="px-3 py-1 text-xs font-medium border rounded disabled:opacity-40" style={{ borderColor:'#d1d5db', color:'#374151' }}>Prev</button>
            <button onClick={() => setStaffPage(prev => prev + 1)} disabled={staffData.pagination.page >= staffData.pagination.totalPages} className="px-3 py-1 text-xs font-medium border rounded disabled:opacity-40" style={{ borderColor:'#d1d5db', color:'#374151' }}>Next</button>
          </div>
        </div>
        </>
      )}
    </div>
  );

  // ── Students Tab ────────────────────────────────────────────────────────────
  const renderStudents = () => (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold" style={{ color: '#1a1f2e' }}>All Students</h2>
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search students..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={studentSearch}
            onChange={(e) => setStudentSearch(e.target.value)}
          />
          <svg className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
      {loading ? renderLoader() : (
        <>
        <TableContainer component={Paper} elevation={0} className="border border-gray-200 rounded-xl overflow-hidden">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f9fafb' }}>
                {['Name', 'Reg. No.', 'Dept', 'Sem', 'CGPA', 'Arrears', 'Apps', 'Offers', 'Status', 'Action'].map(h => (
                  <TableCell key={h}><span className="font-semibold text-gray-600 text-xs">{h}</span></TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {studentData.data.map(st => (
                <TableRow key={st.student_id} hover>
                  <TableCell>
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{st.full_name}</p>
                      <p className="text-xs text-gray-400">{st.email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-gray-600">{st.register_number}</TableCell>
                  <TableCell className="text-xs text-gray-600">{st.department}</TableCell>
                  <TableCell className="text-xs text-gray-600">{st.semester}</TableCell>
                  <TableCell>
                    <span className={`text-xs font-semibold ${parseFloat(st.cgpa) >= 7 ? 'text-green-600' : 'text-orange-600'}`}>
                      {st.cgpa}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs font-semibold ${(st.history_of_arrears || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {st.history_of_arrears ?? 0}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-gray-600">{st.total_applications}</TableCell>
                  <TableCell className="text-xs text-gray-600">{st.offers}</TableCell>
                  <TableCell><StatusBadge status={st.status} /></TableCell>
                  <TableCell>
                    <Tooltip title={st.status === 'ACTIVE' ? 'Deactivate student' : 'Activate student'}>
                      <Button
                        size="small"
                        variant="text"
                        color={st.status === 'ACTIVE' ? 'error' : 'success'}
                        onClick={() => handleStudentStatus(st.user_id, st.status)}
                        sx={{ textTransform: 'none', fontSize: '0.7rem', minWidth: 0 }}
                      >
                        {st.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      </Button>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {studentData.data.length === 0 && (
                <TableRow><TableCell colSpan={10} align="center" className="text-gray-400 py-10">No students registered.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <div className="flex items-center justify-between mt-4 px-1">
          <p className="text-xs text-gray-500">Page {studentData.pagination.page} of {studentData.pagination.totalPages} ({studentData.pagination.total} total)</p>
          <div className="flex gap-2">
            <button onClick={() => setStudentPage(prev => prev - 1)} disabled={studentData.pagination.page <= 1} className="px-3 py-1 text-xs font-medium border rounded disabled:opacity-40" style={{ borderColor:'#d1d5db', color:'#374151' }}>Prev</button>
            <button onClick={() => setStudentPage(prev => prev + 1)} disabled={studentData.pagination.page >= studentData.pagination.totalPages} className="px-3 py-1 text-xs font-medium border rounded disabled:opacity-40" style={{ borderColor:'#d1d5db', color:'#374151' }}>Next</button>
          </div>
        </div>
        </>
      )}
    </div>
  );
  // ── Activity Points Tab ─────────────────────────────────────────────────────
  const renderActivityPoints = () => (
    <div>
      <h2 className="text-2xl font-bold mb-2" style={{ color: '#1a1f2e' }}>Activity Points Verification</h2>
      <p className="text-sm text-gray-500 mb-6">Review and approve or reject student-submitted activity point claims.</p>
      {loading ? renderLoader() : (
        activityData.data.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-gray-400">
            <CheckIcon style={{ fontSize: 56, color: '#86efac' }} />
            <p className="mt-3 text-sm font-medium text-gray-500">All clear! No pending activity points.</p>
          </div>
        ) : (
          <>
          <div className="flex flex-col gap-4">
            {activityData.data.map(ap => (
              <div key={ap.activity_id} className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-indigo-200 transition-colors shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-amber-50 rounded-lg">
                    <ActivityIcon sx={{ color: '#d97706' }} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{ap.activity_type}</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      <span className="font-medium text-gray-700">{ap.full_name}</span>
                      <span className="text-gray-400"> · {ap.register_number} · {ap.department}</span>
                    </p>
                    {ap.proof_url && (
                      <Button 
                        size="small" 
                        variant="text" 
                        onClick={() => setProofModal({ open: true, url: ap.proof_url })}
                        sx={{ textTransform: 'none', mt: 1, p: 0, minWidth: 0, fontSize: '0.75rem' }}
                      >
                        View Proof
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-indigo-600">{ap.points}</p>
                    <p className="text-xs text-gray-400">points</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      startIcon={<CheckIcon />}
                      onClick={() => handleVerifyActivity(ap.activity_id, true)}
                      sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      startIcon={<RejectIcon />}
                      onClick={() => setRejectDialog({ open: true, activityId: ap.activity_id, reason: '' })}
                      sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-6 px-1">
            <p className="text-xs text-gray-500">Page {activityData.pagination.page} of {activityData.pagination.totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setActivityPage(prev => prev - 1)} disabled={activityData.pagination.page <= 1} className="px-3 py-1 text-xs font-medium border rounded disabled:opacity-40" style={{ borderColor:'#d1d5db', color:'#374151' }}>Prev</button>
              <button onClick={() => setActivityPage(prev => prev + 1)} disabled={activityData.pagination.page >= activityData.pagination.totalPages} className="px-3 py-1 text-xs font-medium border rounded disabled:opacity-40" style={{ borderColor:'#d1d5db', color:'#374151' }}>Next</button>
            </div>
          </div>
          </>
        )
      )}
    </div>
  );

  // ── Companies Tab ───────────────────────────────────────────────────────────
  const renderCompanies = () => {
    if (selectedCompany) {
      const { roles } = selectedCompany;
      return (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <button 
              onClick={() => setSelectedCompany(null)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h2 className="text-2xl font-bold" style={{ color: '#1a1f2e' }}>{selectedCompany.company_name || 'Company'}</h2>
            <Chip label={selectedCompany.industry || 'Industry'} size="small" variant="outlined" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-1 space-y-6">
              {(() => {
                const activeRole = roles.find(r => r.job_role_id === selectedRoleId) || roles[0];
                if (!activeRole) return (
                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <p className="text-gray-400 text-sm italic">Select a job role to see details.</p>
                  </div>
                );
                return (
                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <WorkIcon sx={{ color: '#6366f1', fontSize: '1.2rem' }} />
                      <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Job Details</h3>
                    </div>
                    
                    <div className="space-y-5">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Company</p>
                        <p className="text-sm font-semibold text-gray-700">{selectedCompany.company_name}</p>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Job Role</p>
                        <p className="text-sm font-bold text-indigo-600">{activeRole.role_title}</p>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Job Description</p>
                        <p className="text-xs text-gray-600 leading-relaxed max-h-40 overflow-y-auto">{activeRole.job_description || 'No description provided.'}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Deadline</p>
                          <p className="text-xs font-semibold text-gray-700">
                            {activeRole.application_deadline ? new Date(activeRole.application_deadline).toLocaleDateString() : '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Package</p>
                          <p className="text-xs font-bold text-green-600">{activeRole.salary_package || '—'} LPA</p>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-50">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Eligibility Criteria</p>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-gray-500">Min CGPA</span>
                            <span className="font-bold text-gray-700">{activeRole.min_cgpa || '0.00'}</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-gray-500">Min Semester</span>
                            <span className="font-bold text-gray-700">{activeRole.min_semester || '0'}</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-gray-500">Max Backlogs</span>
                            <span className="font-bold text-gray-700">{activeRole.max_backlogs ?? '0'}</span>
                          </div>
                          <div className="mt-2 text-[10px] text-gray-500 leading-normal">
                            <span className="font-bold text-gray-400 uppercase tracking-tighter">DEPARTMENTS:</span><br/>
                            {activeRole.eligible_departments || 'All Departments'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="lg:col-span-2 space-y-6">
              <h3 className="text-lg font-bold text-gray-800 px-1">Job Roles & Recruitment Analytics</h3>
              {roles.map(role => {
                const analytics = roleAnalytics[role.job_role_id];
                return (
                  <div 
                    key={role.job_role_id} 
                    className={`bg-white rounded-xl border overflow-hidden shadow-sm transition-all cursor-pointer ${selectedRoleId === role.job_role_id ? 'border-indigo-500 ring-2 ring-indigo-50' : 'border-gray-200 hover:border-indigo-200'}`}
                    onClick={() => {
                      setSelectedRoleId(role.job_role_id);
                      fetchRoleAnalytics(role.job_role_id);
                    }}
                  >
                    <div className="p-5 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-gray-800">{role.role_title}</h4>
                        <p className="text-xs text-indigo-600 font-medium mt-0.5">₹ {role.salary_package} LPA · {role.location || 'Remote'}</p>
                      </div>
                      <Chip label="Full Time" size="small" sx={{ fontWeight: 600, bgcolor: '#e0e7ff', color: '#4338ca' }} />
                    </div>
                    
                    <div className="p-5">
                      {analytics?.loading ? <CircularProgress size={20} /> : (
                        analytics?.stats && (
                          <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                              <p className="text-2xl font-bold text-blue-700">{analytics.stats.eligible}</p>
                              <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wide">Eligible</p>
                            </div>
                            <div className="text-center p-3 bg-amber-50 rounded-lg border border-amber-100">
                              <p className="text-2xl font-bold text-amber-700">{analytics.stats.applied}</p>
                              <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wide">Applied</p>
                            </div>
                            <div className="text-center p-3 bg-green-50 rounded-lg border border-green-100">
                              <p className="text-2xl font-bold text-green-700">{analytics.stats.offered}</p>
                              <p className="text-[10px] text-green-500 font-bold uppercase tracking-wide">Offered</p>
                            </div>
                          </div>
                        )
                      )}

                      {analytics?.students?.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">Placed Students ({analytics.students.length})</p>
                          <div className="space-y-2">
                            {analytics.students.map(student => (
                              <div key={student.student_id} className="flex items-center justify-between p-2.5 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3">
                                  <Avatar sx={{ width: 28, height: 28, fontSize: '0.7rem', bgcolor: '#10b981' }}>{student.full_name[0]}</Avatar>
                                  <div>
                                    <p className="text-sm font-semibold text-gray-700">{student.full_name}</p>
                                    <p className="text-[10px] text-gray-400">{student.register_number} · {student.department}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-[10px] text-gray-400 uppercase font-medium">Status</p>
                                  <p className="text-xs font-bold text-green-600">OFFERED</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {(!analytics?.students || analytics.students.length === 0) && !analytics?.loading && (
                        <p className="text-center py-4 text-xs text-gray-400 italic">No offers issued yet for this role.</p>
                      )}
                    </div>
                  </div>
                );
              })}
              {roles.length === 0 && <p className="text-center py-10 text-gray-400 border-2 border-dashed rounded-xl">No job roles posted by this company yet.</p>}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-2xl font-bold" style={{ color: '#1a1f2e' }}>Campus Companies</h2>
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search companies..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={companySearch}
              onChange={(e) => setCompanySearch(e.target.value)}
            />
            <svg className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {loading ? renderLoader() : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {companyData.data.map(c => (
                <div 
                  key={c.company_id} 
                  className="bg-white rounded-xl border border-gray-200 p-5 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
                  onClick={() => fetchCompanyDetails(c.company_id)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors">
                      <BusinessIcon sx={{ color: '#6366f1' }} />
                    </div>
                    <Chip label={`${c.job_role_count} Roles`} size="small" variant="outlined" />
                  </div>
                  <h3 className="font-bold text-lg text-gray-800 mb-1 group-hover:text-indigo-600 transition-colors">{c.company_name}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2 h-10 mb-4">{c.description || 'Global technology leader specializing in innovative solutions...'}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-50 text-xs font-medium text-gray-400">
                    <span>{c.industry}</span>
                    <span className="flex items-center gap-1 group-hover:text-indigo-600">
                      View details 
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {companyData.data.length === 0 && (
              <div className="text-center py-20 text-gray-400">No companies found.</div>
            )}
            <div className="flex items-center justify-between mt-8 px-1">
              <p className="text-xs text-gray-500">Page {companyData.pagination.page} of {companyData.pagination.totalPages} ({companyData.pagination.total} total)</p>
              <div className="flex gap-2">
                <button onClick={() => setCompanyPage(prev => prev - 1)} disabled={companyData.pagination.page <= 1} className="px-3 py-1 text-xs font-medium border rounded disabled:opacity-40" style={{ borderColor:'#d1d5db', color:'#374151' }}>Prev</button>
                <button onClick={() => setCompanyPage(prev => prev + 1)} disabled={companyData.pagination.page >= companyData.pagination.totalPages} className="px-3 py-1 text-xs font-medium border rounded disabled:opacity-40" style={{ borderColor:'#d1d5db', color:'#374151' }}>Next</button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  // ── Layout ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden font-sans" style={{ background: '#eef1f7' }}>
      {/* Sidebar — Dark Navy */}
      <aside className="w-60 flex flex-col flex-shrink-0" style={{ background: '#1a1f2e' }}>
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
            <p className="text-xs leading-tight" style={{ color: '#8b92a5' }}>ADMIN PANEL</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          <p className="text-xs font-semibold px-3 mb-3 uppercase" style={{ color: '#8b92a5', letterSpacing: '0.08em', fontSize: '10px' }}>Menu</p>
          <button
            onClick={() => setActiveTab('overview')}
            className={navClass('overview')}
            style={navStyle('overview')}
            onMouseEnter={(e) => { if (activeTab !== 'overview') { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#ffffff'; } }}
            onMouseLeave={(e) => { if (activeTab !== 'overview') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8b92a5'; } }}
          >
            <StatsIcon fontSize="small" /> Overview
          </button>
          <button
            onClick={() => setActiveTab('staff')}
            className={navClass('staff')}
            style={navStyle('staff')}
            onMouseEnter={(e) => { if (activeTab !== 'staff') { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#ffffff'; } }}
            onMouseLeave={(e) => { if (activeTab !== 'staff') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8b92a5'; } }}
          >
            <PeopleIcon fontSize="small" /> Placement Staff
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={navClass('students')}
            style={navStyle('students')}
            onMouseEnter={(e) => { if (activeTab !== 'students') { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#ffffff'; } }}
            onMouseLeave={(e) => { if (activeTab !== 'students') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8b92a5'; } }}
          >
            <PeopleIcon fontSize="small" /> Students
          </button>
          <button
            onClick={() => { setActiveTab('companies'); setSelectedCompany(null); }}
            className={navClass('companies')}
            style={navStyle('companies')}
            onMouseEnter={(e) => { if (activeTab !== 'companies') { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#ffffff'; } }}
            onMouseLeave={(e) => { if (activeTab !== 'companies') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8b92a5'; } }}
          >
            <BusinessIcon fontSize="small" /> Companies
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={navClass('activity')}
            style={navStyle('activity')}
            onMouseEnter={(e) => { if (activeTab !== 'activity') { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#ffffff'; } }}
            onMouseLeave={(e) => { if (activeTab !== 'activity') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8b92a5'; } }}
          >
            <ActivityIcon fontSize="small" />
            <span>Activity Points</span>
            {stats?.pending_activity_points > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {stats.pending_activity_points}
              </span>
            )}
          </button>
        </nav>

        {/* Sign Out */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '12px' }}>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all duration-150"
            style={{ color: '#8b92a5' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#ffffff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8b92a5'; }}
          >
            <LogoutIcon fontSize="small" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Navbar */}
        <header
          className="h-16 flex items-center justify-between px-6 flex-shrink-0"
          style={{ background: '#ffffff', borderBottom: '1px solid #e2e6ea' }}
        >
          <h1 className="text-base font-semibold" style={{ color: '#111827' }}>Admin Panel</h1>
          <div className="flex items-center gap-3">
            {/* Bell */}
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
            {/* User info */}
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium" style={{ color: '#111827' }}>Admin</p>
              <p className="text-xs" style={{ color: '#6b7280' }}>ADMIN</p>
            </div>
            {/* Avatar — click to change password */}
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #6c47ff, #9c74ff)', color: '#ffffff' }}
              onClick={() => setPwDialogOpen(true)}
              title="Change Password"
            >
              A
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-8">
          {/* Action feedback */}
          {actionMsg.text && (
            <Alert severity={actionMsg.severity} className="mb-4 rounded-lg" onClose={() => setActionMsg({ text: '', severity: 'success' })}>
              {actionMsg.text}
            </Alert>
          )}
          <div className="max-w-6xl mx-auto">
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'staff' && renderStaff()}
            {activeTab === 'students' && renderStudents()}
            {activeTab === 'companies' && renderCompanies()}
            {activeTab === 'activity' && renderActivityPoints()}
          </div>
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

      {/* Proof Modal */}
      {proofModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">Verification Proof</h3>
              <button onClick={() => setProofModal({ open: false, url: '' })} className="text-gray-400 hover:text-gray-600">
                <RejectIcon />
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-gray-100 p-4 flex items-center justify-center">
              {proofModal.url.match(/\.(jpeg|jpg|gif|png)$/) ? (
                <img src={proofModal.url} alt="Proof" className="max-w-full h-auto rounded shadow-lg" />
              ) : (
                <div className="text-center p-8">
                  <p className="mb-4 text-gray-600">This proof format is not supported for direct preview.</p>
                  <a href={proofModal.url} target="_blank" rel="noopener noreferrer" className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold inline-block">
                    Open Proof in New Tab
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rejection Dialog */}
      {rejectDialog.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 shadow-xl border border-gray-100">
            <h3 className="text-lg font-bold mb-2 text-gray-900">Reject Application</h3>
            <p className="text-sm text-gray-500 mb-4">Please provide a reason for rejecting this activity point claim. This will be visible to the student.</p>
            <textarea
              className="w-full p-3 border border-gray-200 rounded-lg text-sm mb-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              rows="3"
              placeholder="e.g., Invalid certificate, expired date..."
              value={rejectDialog.reason}
              onChange={(e) => setRejectDialog(prev => ({ ...prev, reason: e.target.value }))}
            ></textarea>
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setRejectDialog({ open: false, activityId: null, reason: '' })} 
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleVerifyActivity(rejectDialog.activityId, false, rejectDialog.reason)} 
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors shadow-sm"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;