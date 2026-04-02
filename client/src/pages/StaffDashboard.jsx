import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import DashboardLayout from './DashboardLayout';

// --- ICONS ---
const BriefcaseIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const ShieldCheckIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const UsersIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const DashboardIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;

const StaffDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState({ name: 'Placement Staff', role: 'STAFF' });
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // Fetch actual staff name from the server
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/staff/profile');
        setUser({ name: res.data.name || 'Staff', role: 'STAFF', designation: res.data.designation });
      } catch (err) {
        console.error('Failed to fetch staff profile', err);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { id: 'create', label: 'Post New Job', icon: <BriefcaseIcon /> },
    { id: 'audit', label: 'Audit Applications', icon: <ShieldCheckIcon /> },
    { id: 'shortlist', label: 'Shortlist & Rank', icon: <UsersIcon /> },
  ];

  return (
    <DashboardLayout
      title="Staff Dashboard"
      user={user}
      sidebarItems={sidebarItems}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onLogout={handleLogout}
    >
      {activeTab === 'dashboard' && <StaffOverview />}
      {activeTab === 'create' && <PostJobForm />}
      {activeTab === 'audit' && <AuditApplications />}
      {activeTab === 'shortlist' && <ShortlistRank />}
    </DashboardLayout>
  );
};

// --- SUB-COMPONENTS (Business Logic) ---

// ── Staff Dashboard Overview ─────────────────────────────────────────────────
const StaffOverview = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/staff/stats');
        setStats(res.data);
      } catch (err) { console.error('Failed to fetch staff stats', err); }
      finally { setLoading(false); }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div>;
  if (!stats) return <p className="text-gray-400 text-center py-16">Failed to load stats.</p>;

  const statCards = [
    { 
      label: 'TOTAL JOBS', value: stats.total_jobs, color: '#4f46e5', bg: '#f5f7ff', border: '#c7d2fe',
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
    },
    { 
      label: 'TOTAL APPLICANTS', value: stats.total_applicants, color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc',
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
    },
    { 
      label: 'SHORTLISTED', value: stats.shortlisted, color: '#059669', bg: '#ecfdf5', border: '#6ee7b7',
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
    },
    { 
      label: 'OFFERED', value: stats.offered, color: '#7c3aed', bg: '#f5f3ff', border: '#c4b5fd',
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
    },
  ];

  return (
    <div>
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {statCards.map(card => (
          <div key={card.label} className="relative overflow-hidden rounded-xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between" style={{ background: card.bg, border: `1.5px solid ${card.border}`, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)' }}>
            <div className="flex items-center justify-between mb-3 relative z-10">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: card.color, opacity: 0.8 }}>{card.label}</p>
              <div className="p-2 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${card.color}15`, color: card.color }}>
                {card.icon}
              </div>
            </div>
            <div className="relative z-10">
              <p className="text-4xl font-extrabold" style={{ color: card.color }}>{card.value}</p>
            </div>
            
            {/* Subtle background icon for depth */}
            <div className="absolute -bottom-4 -right-4 opacity-5 pointer-events-none transform scale-[2.5]" style={{ color: card.color }}>
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Jobs Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Recent Job Postings</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Company</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Applicants</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Deadline</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {stats.recentJobs.map(job => (
              <tr key={job.job_role_id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-3.5">
                  <p className="text-sm font-medium text-gray-800">{job.role_title}</p>
                </td>
                <td className="px-6 py-3.5 text-sm text-gray-600">{job.company_name}</td>
                <td className="px-6 py-3.5">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">{job.applicant_count}</span>
                </td>
                <td className="px-6 py-3.5 text-sm">
                  {job.application_deadline ? (
                    <span style={{ color: new Date(job.application_deadline) < new Date() ? '#ef4444' : '#6b7280' }}>
                      {new Date(job.application_deadline) < new Date() ? '⚠ Expired' : new Date(job.application_deadline).toLocaleDateString()}
                    </span>
                  ) : <span className="text-gray-400">—</span>}
                </td>
              </tr>
            ))}
            {stats.recentJobs.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400 text-sm">No jobs posted yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const PostJobForm = () => {
  const [availableDepts, setAvailableDepts] = useState([]);

  // Job Form State
  const [jobForm, setJobForm] = useState({
    companyName: '',
    industry: '',
    companyImage: '',
    roleTitle: '',
    description: '',
    deadline: '',
    minCgpa: '',
    minSemester: '',
    departments: '',
    maxBacklogs: '',
    salaryPackage: ''
  });

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await api.get('/utils/departments');
        setAvailableDepts(res.data);
      } catch (err) {
        console.error('Failed to fetch departments', err);
      }
    };
    fetchDepts();
  }, []);

  const handleInputChange = (e) => {
    setJobForm({ ...jobForm, [e.target.name]: e.target.value });
  };

  const handleDeptChange = (dept) => {
    const currentDepts = jobForm.departments ? jobForm.departments.split(',').filter(d => d) : [];
    let newDepts;
    if (currentDepts.includes(dept)) {
      newDepts = currentDepts.filter(d => d !== dept);
    } else {
      newDepts = [...currentDepts, dept];
    }
    setJobForm({ ...jobForm, departments: newDepts.join(',') });
  };

  const handleSelectAll = () => {
    const currentDepts = jobForm.departments ? jobForm.departments.split(',') : [];
    const allSelected = availableDepts.length > 0 && availableDepts.every(dept => currentDepts.includes(dept));

    if (allSelected) {
      setJobForm({ ...jobForm, departments: '' });
    } else {
      setJobForm({ ...jobForm, departments: availableDepts.join(',') });
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        company: { name: jobForm.companyName, industry: jobForm.industry, logo_url: jobForm.companyImage },
        job: { title: jobForm.roleTitle, description: jobForm.description, deadline: jobForm.deadline, salary_package: jobForm.salaryPackage },
        criteria: { min_cgpa: jobForm.minCgpa, min_semester: jobForm.minSemester, departments: jobForm.departments, max_backlogs: jobForm.maxBacklogs }
      };
      await api.post('/staff/jobs/create', payload);
      alert('Job posted successfully!');
      setJobForm({ companyName: '', industry: '', companyImage: '', roleTitle: '', description: '', deadline: '', minCgpa: '', minSemester: '', departments: '', maxBacklogs: '', salaryPackage: '' });
    } catch (err) {
      alert('Failed to post job: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6" style={{ color: '#1a1f2e' }}>Create New Job Posting</h2>
      <form onSubmit={handleCreateJob} className="space-y-6">
        {/* Company Details */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-4" style={{ color: '#6c47ff' }}>Company Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Company Name" name="companyName" value={jobForm.companyName} onChange={handleInputChange} className="p-2 border rounded w-full" required />
            <input type="text" placeholder="Industry" name="industry" value={jobForm.industry} onChange={handleInputChange} className="p-2 border rounded w-full" required />
            <input type="text" placeholder="Company Logo URL" name="companyImage" value={jobForm.companyImage} onChange={handleInputChange} className="p-2 border rounded w-full md:col-span-2" />
          </div>
        </div>

        {/* Job Details */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-4" style={{ color: '#6c47ff' }}>Job Role</h3>
          <div className="grid grid-cols-1 gap-4">
            <input type="text" placeholder="Job Title" name="roleTitle" value={jobForm.roleTitle} onChange={handleInputChange} className="p-2 border rounded w-full" required />
            <textarea placeholder="Job Description" name="description" value={jobForm.description} onChange={handleInputChange} className="p-2 border rounded w-full h-24" required />
            <div className="grid grid-cols-2 gap-4">
              <label className="block text-sm font-medium text-gray-700">Deadline:
                <input type="date" name="deadline" value={jobForm.deadline} onChange={handleInputChange} className="mt-1 block w-full p-2 border rounded" required />
              </label>
              <label className="block text-sm font-medium text-gray-700">Salary Package (LPA):
                <input type="text" placeholder="e.g. 12" name="salaryPackage" value={jobForm.salaryPackage} onChange={handleInputChange} className="mt-1 block w-full p-2 border rounded" required />
              </label>
            </div>
          </div>
        </div>

        {/* Eligibility Criteria */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-4" style={{ color: '#6c47ff' }}>Eligibility Criteria</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input type="number" step="0.01" placeholder="Min CGPA" name="minCgpa" value={jobForm.minCgpa} onChange={handleInputChange} className="p-2 border rounded w-full" required />
            <input type="number" placeholder="Min Semester" name="minSemester" value={jobForm.minSemester} onChange={handleInputChange} className="p-2 border rounded w-full" required />
            <input type="number" placeholder="Max Backlogs" name="maxBacklogs" value={jobForm.maxBacklogs} onChange={handleInputChange} className="p-2 border rounded w-full" />
          </div>

          {/* Department Selection UI */}
          <div className="p-4 border rounded w-full bg-white">
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs font-bold text-gray-500 uppercase">Allowed Departments</p>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                {(availableDepts.length > 0 && availableDepts.every(d => jobForm.departments.split(',').includes(d))) ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {availableDepts.map((dept) => (
                <label key={dept} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 rounded p-1">
                  <input
                    type="checkbox"
                    checked={jobForm.departments.split(',').filter(d => d).includes(dept)}
                    onChange={() => handleDeptChange(dept)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  <span className="text-sm text-gray-700">{dept}</span>
                </label>
              ))}
            </div>
            {jobForm.departments === '' && <p className="text-xs text-red-500 mt-1">Select at least one</p>}
          </div>
        </div>

        <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition">
          Post Job
        </button>
      </form>
    </div>
  );
};

const AuditApplications = () => {
  const [auditApps, setAuditApps] = useState([]);

  useEffect(() => {
    const fetchAudit = async () => {
      try {
        const res = await api.get('/staff/applications/audit');
        setAuditApps(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchAudit();
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <span className="text-red-600 mr-2">⚠️</span> Flagged Applications
      </h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resume Used</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {auditApps.map((app, index) => (
              <tr key={index} className="hover:bg-red-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{app.full_name}</div>
                  <div className="text-sm text-gray-500">{app.register_number}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{app.role_title}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <a href={app.resume_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">
                    {app.resume_title}
                  </a>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                    Resume Modified After Apply
                  </span>
                </td>
              </tr>
            ))}
            {auditApps.length === 0 && (
              <tr><td colSpan="4" className="px-6 py-4 text-center text-gray-500">No flagged applications found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ShortlistRank = () => {
  const [jobsList, setJobsList] = useState([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [applicants, setApplicants] = useState([]);
  const [applicantSearch, setApplicantSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortConfig, setSortConfig] = useState({ key: 'ranking_score', direction: 'desc' });
  const [errorMsg, setErrorMsg] = useState('');

  // Override Dialog State
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);
  const [overrideForm, setOverrideForm] = useState({ applicationId: '', reason: '' });
  const [statusEditDialog, setStatusEditDialog] = useState({ open: false, application: null });

  // Edit/Delete State
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({ companyName: '', industry: '', companyImage: '', roleTitle: '', description: '', deadline: '', minCgpa: '', minSemester: '', departments: '', maxBacklogs: '', salaryPackage: '' });
  const [editJobId, setEditJobId] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [availableDepts, setAvailableDepts] = useState([]);

  useEffect(() => {
    api.get('/utils/departments').then(r => setAvailableDepts(r.data)).catch(() => { });
  }, []);

  useEffect(() => {
    const fetchJobsList = async () => {
      try {
        const res = await api.get('/staff/jobs/list');
        setJobsList(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchJobsList();
  }, []);

  useEffect(() => {
    if (selectedJob) {
      setErrorMsg('');
      fetchApplicants(selectedJob);
    } else {
      setApplicants([]);
      setErrorMsg('');
    }
  }, [selectedJob]);

  const fetchApplicants = async (jobId) => {
    try {
      const res = await api.get(`/staff/jobs/${jobId}/applicants`);
      setApplicants(res.data);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Internal Server Error');
    }
  };

  const handleStatusUpdate = async (appId, status) => {
    try {
      await api.post('/staff/applications/status', { applicationId: appId, status });
      setApplicants(prev => prev.map(app => app.application_id === appId ? { ...app, status } : app));
    } catch (err) {
      alert('Update failed');
    }
  };

  // ── Edit Job Handlers ──
  const handleOpenEdit = async (jobId, e) => {
    e.stopPropagation();
    try {
      const res = await api.get(`/staff/jobs/${jobId}/details`);
      const d = res.data;
      setEditForm({
        companyName: d.company_name || '',
        industry: d.industry || '',
        companyImage: d.logo_url || '',
        roleTitle: d.role_title || '',
        description: d.job_description || '',
        deadline: d.application_deadline ? d.application_deadline.split('T')[0] : '',
        minCgpa: d.min_cgpa || '',
        minSemester: d.min_semester || '',
        departments: d.eligible_departments || '',
        maxBacklogs: d.max_backlogs ?? '',
        salaryPackage: d.salary_package || ''
      });
      setEditJobId(jobId);
      setEditDialogOpen(true);
    } catch (err) {
      alert('Failed to load job details');
    }
  };

  const handleEditDeptChange = (dept) => {
    const cur = editForm.departments ? editForm.departments.split(',').filter(d => d) : [];
    const next = cur.includes(dept) ? cur.filter(d => d !== dept) : [...cur, dept];
    setEditForm(f => ({ ...f, departments: next.join(',') }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      await api.put(`/staff/jobs/${editJobId}`, {
        company: { name: editForm.companyName, industry: editForm.industry, logo_url: editForm.companyImage },
        job: { title: editForm.roleTitle, description: editForm.description, deadline: editForm.deadline, salary_package: editForm.salaryPackage },
        criteria: { min_cgpa: editForm.minCgpa, min_semester: editForm.minSemester, departments: editForm.departments, max_backlogs: editForm.maxBacklogs }
      });
      alert('Job updated successfully!');
      setEditDialogOpen(false);
      const res = await api.get('/staff/jobs/list');
      setJobsList(res.data);
    } catch (err) {
      alert('Update failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setEditLoading(false);
    }
  };

  // ── Delete Job Handler ──
  const handleDeleteJob = async (jobId, e) => {
    e.stopPropagation();
    setDeleteConfirmId(jobId);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/staff/jobs/${deleteConfirmId}`);
      setJobsList(prev => prev.filter(j => j.job_role_id !== deleteConfirmId));
      if (selectedJob === deleteConfirmId) { setSelectedJob(''); setApplicants([]); }
      setDeleteConfirmId(null);
    } catch (err) {
      alert('Delete failed: ' + (err.response?.data?.message || err.message));
      setDeleteConfirmId(null);
    }
  };

  const handleGenerateShortlist = async () => {
    if (!selectedJob) return;
    if (!window.confirm("Are you sure? This will calculate scores and automatically SHORTLIST top candidates.")) return;

    try {
      await api.post('/staff/jobs/shortlist', { jobId: selectedJob });
      alert('Shortlist generated successfully!');
      fetchApplicants(selectedJob); // Refresh
    } catch (err) {
      alert('Failed to generate shortlist: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleOpenOverride = (appId) => {
    setOverrideForm({ applicationId: appId, reason: '' });
    setOverrideDialogOpen(true);
  };

  const handleSubmitOverride = async () => {
    if (!overrideForm.reason) {
      alert("Please provide a reason.");
      return;
    }
    try {
      await api.post('/staff/applications/override', {
        applicationId: overrideForm.applicationId,
        overrideReason: overrideForm.reason
      });
      alert('Eligibility Overridden Successfully');
      setOverrideDialogOpen(false);
      fetchApplicants(selectedJob);
    } catch (err) {
      alert('Override failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const processedApplicants = applicants
    .filter(app => {
      const matchesSearch = (app.full_name?.toLowerCase() || '').includes(applicantSearch.toLowerCase()) ||
        (app.register_number?.toLowerCase() || '').includes(applicantSearch.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

  return (
    <div className="flex flex-col h-full space-y-4 relative">

      {/* ── Top Control Bar ── */}
      <div className="bg-white rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3" style={{ border: '1px solid #e5e7eb' }}>
        {/* Job Selector Dropdown */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <label className="text-sm font-semibold whitespace-nowrap" style={{ color: '#374151' }}>Select Job</label>
          <select
            className="flex-1 min-w-0 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
            style={{ border: '1px solid #d1d5db', padding: '7px 12px', color: '#111827', maxWidth: '320px' }}
            value={selectedJob}
            onChange={(e) => setSelectedJob(e.target.value ? parseInt(e.target.value) : '')}
          >
            <option value="">— Choose a job role —</option>
            {jobsList.map(job => (
              <option key={job.job_role_id} value={job.job_role_id}>
                {job.role_title} — {job.company_name || 'Company'}
              </option>
            ))}
          </select>
          {/* Edit/Delete for selected job */}
          {selectedJob && (
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={(e) => handleOpenEdit(selectedJob, e)} title="Edit Job" className="w-7 h-7 rounded flex items-center justify-center transition-colors" style={{ color: '#6366f1' }} onMouseEnter={e => e.currentTarget.style.background = '#eef2ff'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </button>
              <button onClick={(e) => handleDeleteJob(selectedJob, e)} title="Delete Job" className="w-7 h-7 rounded flex items-center justify-center transition-colors" style={{ color: '#ef4444' }} onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          )}
        </div>

        {/* Right side: Auto-Shortlist + Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {selectedJob && (
            <button
              onClick={handleGenerateShortlist}
              className="text-white text-xs font-semibold py-2 px-3.5 rounded-lg flex items-center gap-1.5 transition-colors duration-150"
              style={{ background: '#2563eb' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#1d4ed8'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#2563eb'; }}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              Auto-Shortlist
            </button>
          )}
          <select
            className="text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
            style={{ border: '1px solid #d1d5db', padding: '7px 10px', color: '#374151' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Status</option>
            <option value="APPLIED">Pending</option>
            <option value="SHORTLISTED">Shortlisted</option>
            <option value="OFFERED">Offered</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <div className="relative">
            <input
              type="text"
              placeholder="Search student..."
              className="w-48 pl-8 pr-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200"
              style={{ border: '1px solid #d1d5db' }}
              value={applicantSearch}
              onChange={(e) => setApplicantSearch(e.target.value)}
            />
            <svg className="w-3.5 h-3.5 absolute left-2.5 top-2.5" style={{ color: '#9ca3af' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
        </div>
      </div>

      {/* ── Full-Width Applicants Table ── */}
      <div className="bg-white rounded-xl flex-1 overflow-hidden flex flex-col" style={{ border: '1px solid #e5e7eb' }}>
        {selectedJob ? (
          <div className="flex-1 overflow-auto">
            {errorMsg && (
              <div className="mx-4 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 font-medium">
                ⚠ {errorMsg}
              </div>
            )}
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="sticky top-0 z-10" style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer select-none" style={{ color: '#6b7280' }} onClick={() => handleSort('ranking_score')}>
                    Score {sortConfig.key === 'ranking_score' ? (sortConfig.direction === 'desc' ? '▼' : '▲') : ''}
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#6b7280' }}>Student</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#6b7280' }}>Status</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#6b7280' }}>Eligible</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#6b7280' }}>Resume</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#6b7280' }}>Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {processedApplicants.map((app) => (
                  <tr key={app.application_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="text-indigo-600 font-bold text-sm">{parseFloat(app.ranking_score || 0).toFixed(2)}</span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{app.full_name}</div>
                      <div className="text-xs text-gray-500">{app.cgpa} CGPA • {app.department || '-'}</div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${app.status === 'SHORTLISTED' ? 'bg-green-100 text-green-800' :
                        app.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                        app.status === 'OFFERED' ? 'bg-purple-100 text-purple-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {app.is_overridden ? (
                        <span className="text-xs font-bold text-purple-600" title={app.override_reason}>OVERRIDDEN</span>
                      ) : (
                        app.is_eligible ?
                          <span className="text-xs font-bold text-green-600">YES</span> :
                          <span className="text-xs font-bold text-red-600">NO</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-sm">
                      {app.resume_url ? (
                        <a href={app.resume_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View</a>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-col gap-1">
                        <div className="flex gap-1.5 flex-wrap">
                          {app.status === 'APPLIED' && (
                            <>
                              <button onClick={() => handleStatusUpdate(app.application_id, 'SHORTLISTED')} className="text-green-600 hover:text-green-900 text-xs bg-green-50 px-2 py-1 rounded border border-green-200 font-medium">Accept</button>
                              <button onClick={() => handleStatusUpdate(app.application_id, 'REJECTED')} className="text-red-600 hover:text-red-900 text-xs bg-red-50 px-2 py-1 rounded border border-red-200 font-medium">Reject</button>
                            </>
                          )}
                          {app.status === 'SHORTLISTED' && (
                            <>
                              <span className="flex items-center text-green-700 text-xs bg-green-50 px-2 py-1 rounded border border-green-200 font-medium">
                                Shortlisted
                                <button onClick={() => setStatusEditDialog({ open: true, application: app })} className="ml-1.5 text-green-600 hover:text-green-800 transition-colors" title="Edit/Remove from Shortlist">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                </button>
                              </span>
                              <button onClick={() => { if (window.confirm(`Mark ${app.full_name} as OFFERED for this role?`)) handleStatusUpdate(app.application_id, 'OFFERED'); }} className="text-white text-xs px-2.5 py-1 rounded font-semibold" style={{ background: '#6c47ff' }}>🎉 Mark Offered</button>
                            </>
                          )}
                        </div>
                        {!app.is_eligible && !app.is_overridden && (
                          <button onClick={() => handleOpenOverride(app.application_id)} className="text-purple-600 hover:text-purple-800 text-xs underline text-left">Override Eligibility</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {processedApplicants.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <p className="text-sm font-medium" style={{ color: '#374151' }}>No applicants found</p>
                      <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>Try adjusting your filters or run Auto-Shortlist</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12">
            <svg className="w-12 h-12 mb-3" style={{ color: '#d1d5db' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm font-medium" style={{ color: '#374151' }}>Select a job to view applicants</p>
            <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>Choose a role from the dropdown above to manage applications</p>
          </div>
        )}
      </div>

      {/* Override Dialog */}
      {overrideDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
            <h3 className="text-lg font-bold mb-4 text-gray-800">Override Eligibility</h3>
            <p className="text-sm text-gray-600 mb-4">You are about to force-approve an ineligible student. Please provide a valid reason.</p>
            <textarea className="w-full border rounded p-2 mb-4 h-24 text-sm" placeholder="Reason for override (e.g., Special Principal Approval)..." value={overrideForm.reason} onChange={(e) => setOverrideForm({ ...overrideForm, reason: e.target.value })} />
            <div className="flex justify-end gap-2">
              <button onClick={() => setOverrideDialogOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded text-sm font-medium">Cancel</button>
              <button onClick={handleSubmitOverride} className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm font-medium">Ineligible Override</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-80 shadow-xl">
            <h3 className="text-lg font-bold mb-2 text-gray-800">Delete Job?</h3>
            <p className="text-sm text-gray-600 mb-5">This will permanently delete the job posting and all its applications. This cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded text-sm font-medium">Cancel</button>
              <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Status Edit Dialog */}
      {statusEditDialog.open && statusEditDialog.application && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-96 transform transition-all">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Manage Candidate Status</h3>
              <button onClick={() => setStatusEditDialog({ open: false, application: null })} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <p className="text-sm text-gray-600 mb-5">
              Update status for <strong style={{ color: '#6c47ff' }}>{statusEditDialog.application.full_name}</strong>
            </p>

            <div className="space-y-3">
              <button 
                onClick={() => {
                  handleStatusUpdate(statusEditDialog.application.application_id, 'APPLIED');
                  setStatusEditDialog({ open: false, application: null });
                }} 
                className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors flex items-center justify-between group"
              >
                <div>
                  <div className="text-sm font-semibold text-gray-800 group-hover:text-indigo-700 transition-colors">Revert to Pending</div>
                  <div className="text-xs text-gray-500">Move candidate back to the general pool</div>
                </div>
                <div className="text-indigo-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>
                </div>
              </button>

              <button 
                onClick={() => {
                  handleStatusUpdate(statusEditDialog.application.application_id, 'REJECTED');
                  setStatusEditDialog({ open: false, application: null });
                }} 
                className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-red-300 hover:bg-red-50 transition-colors flex items-center justify-between group"
              >
                <div>
                  <div className="text-sm font-semibold text-gray-800 group-hover:text-red-700 transition-colors">Reject Candidate</div>
                  <div className="text-xs text-gray-500">Remove from consideration</div>
                </div>
                <div className="text-red-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Job Dialog */}
      {editDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-8">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #e5e7eb' }}>
              <h3 className="text-lg font-bold" style={{ color: '#1a1f2e' }}>Edit Job Posting</h3>
              <button onClick={() => setEditDialogOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Company Name</label>
                  <input className="w-full p-2 border rounded text-sm" value={editForm.companyName} onChange={e => setEditForm(f => ({ ...f, companyName: e.target.value }))} required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Industry</label>
                  <input className="w-full p-2 border rounded text-sm" value={editForm.industry} onChange={e => setEditForm(f => ({ ...f, industry: e.target.value }))} required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Job Title</label>
                <input className="w-full p-2 border rounded text-sm" value={editForm.roleTitle} onChange={e => setEditForm(f => ({ ...f, roleTitle: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                <textarea className="w-full p-2 border rounded text-sm h-20" value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} required />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Min CGPA</label>
                  <input type="number" step="0.01" className="w-full p-2 border rounded text-sm" value={editForm.minCgpa} onChange={e => setEditForm(f => ({ ...f, minCgpa: e.target.value }))} required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Min Sem</label>
                  <input type="number" className="w-full p-2 border rounded text-sm" value={editForm.minSemester} onChange={e => setEditForm(f => ({ ...f, minSemester: e.target.value }))} required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Max Backlogs</label>
                  <input type="number" className="w-full p-2 border rounded text-sm" value={editForm.maxBacklogs} onChange={e => setEditForm(f => ({ ...f, maxBacklogs: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Application Deadline</label>
                  <input type="date" className="w-full p-2 border rounded text-sm" value={editForm.deadline} onChange={e => setEditForm(f => ({ ...f, deadline: e.target.value }))} required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Package (LPA)</label>
                  <input type="text" className="w-full p-2 border rounded text-sm" value={editForm.salaryPackage} onChange={e => setEditForm(f => ({ ...f, salaryPackage: e.target.value }))} required />
                </div>
              </div>
              {availableDepts.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">Eligible Departments</label>
                  <div className="flex flex-wrap gap-2">
                    {availableDepts.map(dept => {
                      const selected = editForm.departments.split(',').map(d => d.trim()).includes(dept);
                      return (
                        <button type="button" key={dept} onClick={() => handleEditDeptChange(dept)}
                          className="px-2 py-1 rounded text-xs font-medium border transition-colors"
                          style={selected ? { background: '#6c47ff', color: '#fff', borderColor: '#6c47ff' } : { background: '#fff', color: '#374151', borderColor: '#d1d5db' }}>
                          {dept}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditDialogOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded text-sm font-medium">Cancel</button>
                <button type="submit" disabled={editLoading} className="px-5 py-2 text-white rounded text-sm font-semibold" style={{ background: '#6c47ff' }}>{editLoading ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffDashboard;
