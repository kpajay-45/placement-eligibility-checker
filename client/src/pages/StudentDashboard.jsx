import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import {
  Button,
  Alert,
  TextField,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material';
import {
  Person as PersonIcon,
  Work as WorkIcon,
  Business as BusinessIcon,
  ExitToApp as LogoutIcon,
  EmojiEvents as SkillsIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Star as ActivityIcon
} from '@mui/icons-material';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';

const StudentDashboard = () => {
  // UI State
  const [activeSection, setActiveSection] = useState('details');

  // Data State
  const [jobs, setJobs] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [profile, setProfile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [activityPoints, setActivityPoints] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityForm, setActivityForm] = useState({ activity_type: '', points: '', proof_url: '' });
  const [activitySubmitting, setActivitySubmitting] = useState(false);
  const [activityError, setActivityError] = useState('');

  // Password Change State
  const [pwDialogOpen, setPwDialogOpen] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  // Loading States
  const [profileLoading, setProfileLoading] = useState(true);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [appliedLoading, setAppliedLoading] = useState(true);
  const [skillsLoading, setSkillsLoading] = useState(true);
  const [appliedFilter, setAppliedFilter] = useState('ALL');

  // Skill Form State
  const [skillForm, setSkillForm] = useState({ skill_name: '', certificate_url: '' });
  const [skillFormError, setSkillFormError] = useState('');

  // Edit State
  const [editForm, setEditForm] = useState({
    full_name: '',
    register_number: '',
    department: '',
    semester: '',
    cgpa: '',
    personal_email: '',
    batch_year: '',
    history_of_arrears: '',
    attendance_percentage: '',
    marks_10th: '',
    marks_12th: '',
    sgpa_sem1: '', sgpa_sem2: '', sgpa_sem3: '', sgpa_sem4: '',
    sgpa_sem5: '', sgpa_sem6: '', sgpa_sem7: '', sgpa_sem8: ''
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Resume Dialog State
  const [resumeDialogOpen, setResumeDialogOpen] = useState(false);
  const [resumeForm, setResumeForm] = useState({ title: '', url: '', resumeId: '' });
  const [isEditingResume, setIsEditingResume] = useState(false);

  // Apply Resume Picker Dialog
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [applyingJobId, setApplyingJobId] = useState(null);
  const [selectedResumeId, setSelectedResumeId] = useState('');

  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
    fetchJobs();
    fetchResumes();
    fetchAppliedJobs();
    fetchSkills();
    fetchActivityPoints();
  }, []);

  const fetchProfile = async () => {
    setProfileLoading(true);
    try {
      const res = await api.get('/student/profile');
      setProfile(res.data);
      setEditForm({
        full_name: res.data.full_name || '',
        register_number: res.data.register_number || '',
        department: res.data.department || '',
        semester: res.data.semester || '',
        cgpa: res.data.cgpa || '',
        personal_email: res.data.personal_email || '',
        batch_year: res.data.batch_year || '',
        history_of_arrears: res.data.history_of_arrears ?? '',
        attendance_percentage: res.data.attendance_percentage || '',
        marks_10th: res.data.marks_10th ?? '',
        marks_12th: res.data.marks_12th ?? '',
        sgpa_sem1: res.data.sgpa_sem1 ?? '', sgpa_sem2: res.data.sgpa_sem2 ?? '',
        sgpa_sem3: res.data.sgpa_sem3 ?? '', sgpa_sem4: res.data.sgpa_sem4 ?? '',
        sgpa_sem5: res.data.sgpa_sem5 ?? '', sgpa_sem6: res.data.sgpa_sem6 ?? '',
        sgpa_sem7: res.data.sgpa_sem7 ?? '', sgpa_sem8: res.data.sgpa_sem8 ?? ''
      });
    } catch (err) {
      console.error(err);
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchJobs = async () => {
    setJobsLoading(true);
    try {
      const res = await api.get('/student/jobs/eligible');
      setJobs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setJobsLoading(false);
    }
  };

  const fetchResumes = async () => {
    try {
      const res = await api.get('/student/resumes');
      setResumes(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAppliedJobs = async () => {
    setAppliedLoading(true);
    try {
      const res = await api.get('/student/applications');
      setAppliedJobs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setAppliedLoading(false);
    }
  };

  const fetchSkills = async () => {
    setSkillsLoading(true);
    try {
      const res = await api.get('/student/skills');
      setSkills(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setSkillsLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    const currentYear = new Date().getFullYear();
    const cgpa = parseFloat(editForm.cgpa);
    const arrears = parseInt(editForm.history_of_arrears);
    const attendance = parseFloat(editForm.attendance_percentage);
    const batchYear = parseInt(editForm.batch_year);

    if (editForm.cgpa !== '' && (isNaN(cgpa) || cgpa < 0 || cgpa > 10)) {
      alert('CGPA must be between 0.00 and 10.00.');
      return;
    }
    if (editForm.history_of_arrears !== '' && (isNaN(arrears) || arrears < 0 || arrears > 48)) {
      alert('Number of backlogs must be between 0 and 48.');
      return;
    }
    if (editForm.attendance_percentage !== '' && (isNaN(attendance) || attendance < 0 || attendance > 100)) {
      alert('Attendance percentage must be between 0 and 100.');
      return;
    }
    if (editForm.batch_year !== '' && (isNaN(batchYear) || batchYear < 1998 || batchYear > currentYear)) {
      alert(`Batch year must be between 1998 and ${currentYear}.`);
      return;
    }
    // Validate 10th/12th marks
    for (const [label, key] of [['10th marks', 'marks_10th'], ['12th marks', 'marks_12th']]) {
      if (editForm[key] !== '') {
        const n = parseFloat(editForm[key]);
        if (isNaN(n) || n < 0 || n > 100) { alert(`${label} must be between 0 and 100.`); return; }
      }
    }
    // Validate SGPA fields
    for (let i = 1; i <= 8; i++) {
      const key = `sgpa_sem${i}`;
      if (editForm[key] !== '') {
        const n = parseFloat(editForm[key]);
        if (isNaN(n) || n < 0 || n > 10) { alert(`SGPA for Semester ${i} must be between 0 and 10.`); return; }
      }
    }

    try {
      await api.put('/student/profile', editForm);
      setIsEditingProfile(false);
      fetchProfile();
      alert('Profile updated successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update profile');
    }
  };

  // Step 1: Click "Apply Now" — open resume picker if >1 resumes, else apply directly
  const handleApply = (jobId) => {
    if (resumes.length === 0) {
      alert('Please upload a resume before applying.');
      handleOpenAddResume();
      return;
    }
    if (resumes.length === 1) {
      // Only one resume — apply directly
      submitApplication(jobId, resumes[0].resume_id);
    } else {
      // Multiple resumes — show picker dialog
      setApplyingJobId(jobId);
      setSelectedResumeId(resumes[0].resume_id);
      setApplyDialogOpen(true);
    }
  };

  // Step 2: Submit application with chosen resumeId
  const submitApplication = async (jobId, resumeId) => {
    try {
      await api.post('/student/jobs/apply', {
        jobRoleId: jobId,
        resumeId: resumeId
      });
      alert('Application submitted successfully!');
      fetchAppliedJobs();
    } catch (err) {
      alert(err.response?.data?.message || 'Application failed');
    }
  };

  const handleApplyDialogConfirm = () => {
    setApplyDialogOpen(false);
    submitApplication(applyingJobId, selectedResumeId);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // --- Skills Handlers ---
  const handleAddSkill = async () => {
    setSkillFormError('');
    if (!skillForm.skill_name.trim()) {
      setSkillFormError('Skill name is required.');
      return;
    }
    try {
      const res = await api.post('/student/skills', {
        skill_name: skillForm.skill_name,
        certificate_url: skillForm.certificate_url || null
      });
      setSkills(prev => [res.data, ...prev]);
      setSkillForm({ skill_name: '', certificate_url: '' });
    } catch (err) {
      setSkillFormError(err.response?.data?.message || 'Failed to add skill');
    }
  };

  const handleDeleteSkill = async (skillId) => {
    if (!window.confirm('Remove this skill?')) return;
    try {
      await api.delete(`/student/skills/${skillId}`);
      setSkills(prev => prev.filter(s => s.skill_id !== skillId));
    } catch (err) {
      alert('Failed to delete skill');
    }
  };

  // --- Resume Handlers ---
  const handleOpenAddResume = () => {
    setResumeForm({ title: '', url: '', resumeId: '' });
    setIsEditingResume(false);
    setResumeDialogOpen(true);
  };

  const handleOpenEditResume = () => {
    if (resumes.length === 0) {
      alert('No resumes found to edit. Please add one first.');
      handleOpenAddResume();
      return;
    }
    const current = resumes[0];
    setResumeForm({
      title: current.resume_title || '',
      url: '',
      resumeId: current.resume_id
    });
    setIsEditingResume(true);
    setResumeDialogOpen(true);
  };

  const handleResumeSubmit = async () => {
    try {
      const payload = {
        title: resumeForm.title,
        fileUrl: resumeForm.url,
        resumeId: isEditingResume ? resumeForm.resumeId : undefined
      };
      await api.post('/student/resume/upload', payload);
      alert(isEditingResume ? 'Resume updated (New Version Created)!' : 'Resume uploaded successfully!');
      setResumeDialogOpen(false);
      fetchResumes();
    } catch (err) {
      alert('Failed to upload resume: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleResumeInputChange = (e) => {
    setResumeForm({ ...resumeForm, [e.target.name]: e.target.value });
  };

  // --- Activity Points ---
  const fetchActivityPoints = async () => {
    setActivityLoading(true);
    try {
      const res = await api.get('/student/activity-points');
      setActivityPoints(res.data);
    } catch (err) {
      console.error('Failed to fetch activity points', err);
    } finally {
      setActivityLoading(false);
    }
  };

  const handleActivitySubmit = async () => {
    setActivityError('');
    if (!activityForm.activity_type.trim() || !activityForm.points) {
      setActivityError('Both fields are required.');
      return;
    }
    setActivitySubmitting(true);
    try {
      const res = await api.post('/student/activity-points', activityForm);
      setActivityPoints(prev => [res.data, ...prev]);
      setActivityForm({ activity_type: '', points: '', proof_url: '' });
    } catch (err) {
      setActivityError(err.response?.data?.message || 'Failed to submit claim');
    } finally {
      setActivitySubmitting(false);
    }
  };

  // --- Password Change ---
  const handleChangePassword = async () => {
    setPwError('');
    setPwSuccess('');
    if (!pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmPassword) {
      setPwError('All fields are required.');
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('New passwords do not match.');
      return;
    }
    if (pwForm.newPassword.length < 6) {
      setPwError('New password must be at least 6 characters.');
      return;
    }
    setPwLoading(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword
      });
      setPwSuccess('Password changed successfully!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPwError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setPwLoading(false);
    }
  };


  // --- Active sidebar nav class/style helpers ---
  const navClass = (section) => activeSection === section
    ? 'w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-lg transition-all duration-150'
    : 'w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150';

  const navStyle = (section) => activeSection === section
    ? { background: '#6c47ff', color: '#ffffff' }
    : { color: '#8b92a5' };

  // --- Loading Spinner ---
  const renderLoader = () => (
    <div className="flex justify-center items-center py-16">
      <CircularProgress />
    </div>
  );

  // --- Render Sections ---
  const renderMyDetails = () => (
    <div className="bg-white rounded-xl shadow-sm p-8 max-w-3xl border border-gray-100">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold mb-4" style={{ color: '#6c47ff' }}>My Details</h2>
        {!isEditingProfile ? (
          <Button variant="outlined" onClick={() => setIsEditingProfile(true)}>Edit Profile</Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="text" color="error" onClick={() => setIsEditingProfile(false)}>Cancel</Button>
            <Button variant="contained" color="success" onClick={handleUpdateProfile}>Save Changes</Button>
          </div>
        )}
      </div>
      <Divider sx={{ mb: 3 }} />

      {profileLoading ? renderLoader() : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TextField
            label="Full Name"
            size="small"
            fullWidth
            value={editForm.full_name}
            onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
            disabled={!isEditingProfile}
            placeholder="e.g., Ajay K P"
          />
          <TextField
            label="Register Number"
            size="small"
            fullWidth
            value={editForm.register_number}
            onChange={(e) => setEditForm({ ...editForm, register_number: e.target.value })}
            disabled={!isEditingProfile}
            placeholder="e.g., REG101"
          />
          <TextField
            label="Department"
            size="small"
            fullWidth
            value={editForm.department}
            onChange={(e) => setEditForm({ ...editForm, department: e.target.value.toUpperCase() })}
            disabled={!isEditingProfile}
            placeholder="e.g., CSE"
            helperText={isEditingProfile ? 'Must match the dept name exactly as posted in jobs (e.g. CSE, ECE)' : ''}
          />
          <TextField
            label="Current Semester"
            size="small"
            fullWidth
            type="number"
            inputProps={{ min: 1, max: 8 }}
            value={editForm.semester}
            onChange={(e) => setEditForm({ ...editForm, semester: e.target.value })}
            disabled={!isEditingProfile}
          />
          <TextField
            label="CGPA"
            size="small"
            fullWidth
            type="number"
            inputProps={{ min: 0, max: 10, step: 0.01 }}
            value={editForm.cgpa}
            onChange={(e) => setEditForm({ ...editForm, cgpa: e.target.value })}
            disabled={!isEditingProfile}
            placeholder="e.g., 8.50"
          />
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">College Email</p>
            <p className="text-base text-gray-800">{profile?.college_email || profile?.email || '—'}</p>
            <p className="text-xs text-gray-400 mt-0.5">Not editable — set during registration</p>
          </div>

          <div className="md:col-span-2">
            <Divider sx={{ my: 2 }} />
            <h3 className="text-sm font-semibold text-gray-600 mb-3">Additional Info</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField
                label="Personal Email"
                size="small"
                fullWidth
                value={editForm.personal_email}
                onChange={(e) => setEditForm({ ...editForm, personal_email: e.target.value })}
                disabled={!isEditingProfile}
              />
              <TextField
                label={`Batch Year (1998–${new Date().getFullYear()})`}
                size="small"
                fullWidth
                type="number"
                inputProps={{ min: 1998, max: new Date().getFullYear(), step: 1 }}
                value={editForm.batch_year}
                onChange={(e) => setEditForm({ ...editForm, batch_year: e.target.value })}
                disabled={!isEditingProfile}
              />
              <TextField
                label="History of Arrears (Backlogs)"
                size="small"
                fullWidth
                type="number"
                inputProps={{ min: 0, max: 48, step: 1 }}
                value={editForm.history_of_arrears}
                onChange={(e) => setEditForm({ ...editForm, history_of_arrears: e.target.value })}
                disabled={!isEditingProfile}
              />
              <TextField
                label="Attendance Percentage"
                size="small"
                fullWidth
                type="number"
                inputProps={{ min: 0, max: 100, step: 0.01 }}
                value={editForm.attendance_percentage}
                onChange={(e) => setEditForm({ ...editForm, attendance_percentage: e.target.value })}
                disabled={!isEditingProfile}
              />
            </div>
          </div>

          {/* ── Academic History Section ── */}
          <div className="md:col-span-2">
            <Divider sx={{ my: 2 }} />
            <h3 className="text-sm font-semibold text-gray-600 mb-3">Board Exam Marks</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <TextField
                label="10th Board Marks (%)"
                size="small"
                fullWidth
                type="number"
                inputProps={{ min: 0, max: 100, step: 0.01 }}
                value={editForm.marks_10th}
                onChange={(e) => setEditForm({ ...editForm, marks_10th: e.target.value })}
                disabled={!isEditingProfile}
                placeholder="e.g., 92.50"
              />
              <TextField
                label="12th Board Marks (%)"
                size="small"
                fullWidth
                type="number"
                inputProps={{ min: 0, max: 100, step: 0.01 }}
                value={editForm.marks_12th}
                onChange={(e) => setEditForm({ ...editForm, marks_12th: e.target.value })}
                disabled={!isEditingProfile}
                placeholder="e.g., 88.00"
              />
            </div>

            <Divider sx={{ my: 2 }} />
            <h3 className="text-sm font-semibold text-gray-600 mb-3">Semester-wise SGPA</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1,2,3,4,5,6,7,8].map(sem => {
                const currentSem = parseInt(editForm.semester) || 8;
                const isLocked = sem > currentSem;
                return (
                  <TextField
                    key={sem}
                    label={`Sem ${sem} SGPA`}
                    size="small"
                    fullWidth
                    type="number"
                    inputProps={{ min: 0, max: 10, step: 0.01 }}
                    value={editForm[`sgpa_sem${sem}`]}
                    onChange={(e) => setEditForm({ ...editForm, [`sgpa_sem${sem}`]: e.target.value })}
                    disabled={!isEditingProfile || isLocked}
                    placeholder={isLocked ? 'N/A' : '0.00–10.00'}
                    helperText={isLocked ? `Sem ${sem} not reached` : ''}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderSkills = () => (
    <div className="bg-white rounded-xl shadow-sm p-8 max-w-3xl border border-gray-100">
      <h2 className="text-2xl font-semibold mb-2" style={{ color: '#6c47ff' }}>My Skills</h2>
      <p className="text-sm text-gray-500 mb-6">Add technical or soft skills with an optional certificate link. <span className="text-gray-400">(Max 20)</span></p>
      <Divider sx={{ mb: 4 }} />

      <div className="bg-gray-50 rounded-lg p-5 border border-gray-200 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <AddIcon fontSize="small" /> Add New Skill
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
          <TextField
            label="Skill Name *"
            size="small"
            fullWidth
            value={skillForm.skill_name}
            onChange={(e) => { setSkillForm({ ...skillForm, skill_name: e.target.value }); setSkillFormError(''); }}
            error={!!skillFormError}
            helperText={skillFormError}
            placeholder="e.g., React, Python, Machine Learning"
            onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
          />
          <TextField
            label="Certificate URL (optional)"
            size="small"
            fullWidth
            value={skillForm.certificate_url}
            onChange={(e) => setSkillForm({ ...skillForm, certificate_url: e.target.value })}
            placeholder="https://drive.google.com/..."
          />
        </div>
        <Button
          variant="contained"
          onClick={handleAddSkill}
          startIcon={<AddIcon />}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          Add Skill
        </Button>
      </div>

      {skillsLoading ? renderLoader() : (
        skills.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <SkillsIcon style={{ fontSize: 48, marginBottom: 8 }} />
            <p className="text-sm">No skills added yet. Start by adding one above!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {skills.map((skill) => (
              <div key={skill.skill_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                <div className="flex items-center gap-3">
                  <Chip label={skill.skill_name} color="primary" variant="outlined" size="small" sx={{ fontWeight: 600 }} />
                  {skill.certificate_url ? (
                    <a href={skill.certificate_url} target="_blank" rel="noopener noreferrer" className="text-xs hover:underline flex items-center gap-1" style={{ color: '#6c47ff' }}>
                      🏆 View Certificate
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400 italic">No certificate</span>
                  )}
                </div>
                <IconButton size="small" onClick={() => handleDeleteSkill(skill.skill_id)} sx={{ color: 'error.main', '&:hover': { bgcolor: '#fef2f2' } }}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );

  const STATUS_STEPS = ['APPLIED', 'SHORTLISTED', 'OFFERED'];
  // Filter tabs: 'PENDING' maps to DB status 'APPLIED' (awaiting review)
  const FILTER_TABS = [
    { label: 'All', value: 'ALL' },
    { label: 'Pending', value: 'APPLIED' },
    { label: 'Shortlisted', value: 'SHORTLISTED' },
    { label: 'Offered', value: 'OFFERED' },
    { label: 'Rejected', value: 'REJECTED' },
  ];

  const STATUS_LABEL = {
    APPLIED: 'Pending',
    SHORTLISTED: 'Shortlisted',
    OFFERED: 'Offered',
    REJECTED: 'Rejected',
  };

  const statusChipStyle = {
    APPLIED: { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-400' },
    SHORTLISTED: { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500' },
    OFFERED: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' },
    REJECTED: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-400' },
  };

  const renderAppliedCompanies = () => {
    const filtered = appliedFilter === 'ALL'
      ? appliedJobs
      : appliedJobs.filter(a => a.status === appliedFilter);

    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-semibold" style={{ color: '#6c47ff' }}>Applied Companies</h2>
          <span className="text-sm text-gray-400 font-medium">{appliedJobs.length} application{appliedJobs.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2 mb-6">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setAppliedFilter(tab.value)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${appliedFilter === tab.value
                ? 'bg-violet-600 text-white border-violet-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-violet-400 hover:text-violet-600'
                }`}
            >
              {tab.value === 'ALL' ? `All (${appliedJobs.length})` : tab.label}
            </button>
          ))}
        </div>

        {appliedLoading ? renderLoader() : (
          filtered.length === 0 ? (
            /* ── Empty state ── */
            <div className="flex flex-col items-center py-16 text-center">
              <WorkIcon style={{ fontSize: 60, color: '#d1d5db' }} />
              <p className="mt-3 text-lg font-semibold text-gray-500">
                {appliedFilter === 'ALL' ? 'No applications yet' : `No ${appliedFilter.toLowerCase()} applications`}
              </p>
              <p className="text-sm text-gray-400 mt-1 mb-6">
                {appliedFilter === 'ALL'
                  ? 'Browse available openings and apply to get started.'
                  : 'Try switching to a different filter above.'}
              </p>
              {appliedFilter === 'ALL' && (
                <Button
                  variant="contained"
                  onClick={() => setActiveSection('applicable')}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  Browse Applicable Companies
                </Button>
              )}
            </div>
          ) : (
            /* ── Cards ── */
            <div className="flex flex-col gap-4">
              {filtered.map((app) => {
                const style = statusChipStyle[app.status] || { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' };
                const stepIdx = STATUS_STEPS.indexOf(app.status);
                const isRejected = app.status === 'REJECTED';
                const appliedDate = app.applied_at
                  ? new Date(app.applied_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                  : '—';

                return (
                  <div
                    key={app.application_id}
                    className={`rounded-xl border ${isRejected ? 'border-red-200 bg-red-50/30' : 'border-gray-200 bg-white'
                      } overflow-hidden shadow-sm hover:shadow-md transition-shadow`}
                  >
                    {/* Card top */}
                    <div className="flex items-start gap-4 p-5">
                      {/* Logo */}
                      <div className="w-14 h-14 flex-shrink-0 bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200 overflow-hidden">
                        {app.logo_url
                          ? <img src={app.logo_url} alt={app.company_name} className="w-full h-full object-contain p-1" onError={(e) => { e.target.style.display = 'none'; }} />
                          : <BusinessIcon style={{ fontSize: 28, color: '#9ca3af' }} />}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div>
                            <h3 className="font-bold text-gray-800 text-base">{app.company_name}</h3>
                            <p className="text-sm text-gray-500 mt-0.5">{app.role_title}</p>
                          </div>
                          {/* Status badge */}
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                            {STATUS_LABEL[app.status] || app.status}
                          </span>
                        </div>

                        {/* Meta row */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                          <span>📄 {app.resume_title}</span>
                          <span>📅 Applied {appliedDate}</span>
                          {app.resume_file_url ? (
                            <a
                              href={app.resume_file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 hover:underline font-medium" style={{ color: '#6c47ff' }}
                            >
                              🔗 View Resume
                            </a>
                          ) : (
                            <span className="text-gray-400 italic">No resume URL stored</span>
                          )}
                        </div>

                        {/* ⚠️ Warning: not eligible */}
                        {app.is_eligible === 0 && !app.is_overridden && (
                          <div className="mt-2 flex items-center gap-2 text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
                            ⚠️ <span><strong>Ineligible application</strong> — staff may override or reject this.</span>
                          </div>
                        )}

                        {/* ⚠️ Warning: resume updated after apply */}
                        {app.resume_updated_after_apply === 1 && (
                          <div className="mt-2 flex items-center gap-2 text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                            ⚠️ <span><strong>Resume updated after applying</strong> — your application is flagged for staff review.</span>
                          </div>
                        )}

                        {/* ✅ Overridden notice */}
                        {app.is_overridden === 1 && (
                          <div className="mt-2 flex items-center gap-2 text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2">
                            ✅ <span><strong>Eligibility overridden</strong> by placement staff.</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ── Status Stepper ── */}
                    {!isRejected ? (
                      <div className="px-5 pb-4">
                        <div className="flex items-center gap-0">
                          {STATUS_STEPS.map((step, i) => {
                            const done = stepIdx >= i;
                            const active = stepIdx === i;
                            return (
                              <React.Fragment key={step}>
                                <div className="flex flex-col items-center">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 ${done
                                    ? active
                                      ? 'bg-violet-600 border-violet-600 text-white'
                                      : 'bg-green-500 border-green-500 text-white'
                                    : 'bg-white border-gray-300 text-gray-400'
                                    }`}>
                                    {done && !active ? '✓' : i + 1}
                                  </div>
                                  <span className={`text-xs mt-1 font-medium ${done ? (active ? 'text-violet-600' : 'text-green-600') : 'text-gray-400'
                                    }`}>
                                    {step.charAt(0) + step.slice(1).toLowerCase()}
                                  </span>
                                </div>
                                {i < STATUS_STEPS.length - 1 && (
                                  <div className={`flex-1 h-0.5 mx-1 mb-4 rounded ${stepIdx > i ? 'bg-green-400' : 'bg-gray-200'
                                    }`} />
                                )}
                              </React.Fragment>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="px-5 pb-4">
                        <div className="text-xs text-red-500 font-medium flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-red-400" /> Application was not selected for further rounds.
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    );
  };

  const renderApplicableCompanies = () => (
    <div>
      <h2 className="text-2xl font-semibold mb-6" style={{ color: '#6c47ff' }}>Applicable Companies</h2>
      {jobsLoading ? renderLoader() : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <div key={job.job_role_id} className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden hover:shadow-md transition-shadow duration-300">
              <div className="h-36 bg-gray-100 flex items-center justify-center border-b border-gray-100">
                {job.logo_url ? (
                  <img
                    src={job.logo_url}
                    alt={job.company_name}
                    className="w-full h-full object-contain p-4"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <BusinessIcon style={{ fontSize: 50, color: '#9ca3af' }} />
                )}
              </div>
              <div className="p-5 flex-grow">
                <h3 className="text-lg font-bold text-gray-800 mb-1">{job.company_name}</h3>
                <p className="text-sm text-gray-600 mb-3 font-medium">{job.role_title}</p>
                <div className="inline-block bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-1 rounded">
                  Min CGPA: {job.min_cgpa}
                </div>
              </div>
              <div className="p-5 pt-0 flex flex-col gap-3">
                <div className="flex gap-2 w-full">
                  <Button variant="outlined" size="small" fullWidth sx={{ textTransform: 'none' }} onClick={handleOpenAddResume}>Add Resume</Button>
                  <Button variant="outlined" size="small" fullWidth sx={{ textTransform: 'none' }} onClick={handleOpenEditResume}>Edit Resume</Button>
                </div>
                {(() => {
                  const isApplied = appliedJobs.some(app => app.job_role_id === job.job_role_id);
                  return (
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => !isApplied && handleApply(job.job_role_id)}
                      disabled={isApplied}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        '&.Mui-disabled': {
                          backgroundColor: '#2e7d32',
                          color: '#ffffff'
                        }
                      }}
                    >
                      {isApplied ? 'Applied' : 'Apply Now'}
                    </Button>
                  );
                })()}
              </div>
            </div>
          ))}
          {jobs.length === 0 && (
            <div className="col-span-full">
              <Alert severity="info">No eligible companies found at this time.</Alert>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderActivityPoints = () => (
    <div className="bg-white rounded-xl shadow-sm p-8 max-w-3xl border border-gray-100">
      <h2 className="text-2xl font-semibold mb-2" style={{ color: '#6c47ff' }}>Activity Points</h2>
      <p className="text-sm text-gray-500 mb-6">Submit extracurricular achievements for admin verification. Approved points boost your placement ranking score.</p>
      <Divider sx={{ mb: 4 }} />
      <div className="bg-gray-50 rounded-lg p-5 mb-6 border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Submit New Claim</h3>
        {activityError && <Alert severity="error" sx={{ mb: 2 }}>{activityError}</Alert>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <TextField label="Activity Type" placeholder="Hackathon..." size="small" fullWidth value={activityForm.activity_type} onChange={e => setActivityForm(f => ({ ...f, activity_type: e.target.value }))} />
          <TextField label="Points" type="number" size="small" fullWidth value={activityForm.points} onChange={e => setActivityForm(f => ({ ...f, points: e.target.value }))} />
          <TextField label="Proof URL" placeholder="Drive/Image Link" size="small" fullWidth value={activityForm.proof_url} onChange={e => setActivityForm(f => ({ ...f, proof_url: e.target.value }))} />
        </div>
        <Button variant="contained" size="small" disabled={activitySubmitting} onClick={handleActivitySubmit} startIcon={<AddIcon />} sx={{ textTransform: 'none', background: '#6c47ff', '&:hover': { background: '#5534e0' } }}>
          {activitySubmitting ? 'Submitting...' : 'Submit Claim'}
        </Button>
      </div>
      {activityLoading ? renderLoader() : activityPoints.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">No activity points submitted yet.</p>
      ) : (
        <div className="space-y-3">
          {activityPoints.map(item => {
            const isApproved = item.status === 'APPROVED';
            const isRejected = item.status === 'REJECTED';
            
            let statusConfig = { bg: '#fafafa', border: '#e5e7eb', text: '#6b7280', label: '⏳ Pending', badgeBg: 'bg-yellow-100', badgeText: 'text-yellow-700' };
            if (isApproved) statusConfig = { bg: '#f0fdf4', border: '#bbf7d0', text: '#16a34a', label: '✓ Approved', badgeBg: 'bg-green-100', badgeText: 'text-green-700' };
            if (isRejected) statusConfig = { bg: '#fef2f2', border: '#fecaca', text: '#dc2626', label: '✖ Rejected', badgeBg: 'bg-red-100', badgeText: 'text-red-700' };

            return (
              <div key={item.activity_id} className="flex flex-col rounded-lg border overflow-hidden shadow-sm" style={{ background: statusConfig.bg, borderColor: statusConfig.border }}>
                <div className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{item.activity_type}</p>
                    <p className="text-xs text-gray-500">{new Date(item.created_at).toLocaleDateString()} · {item.points} pts</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusConfig.badgeBg} ${statusConfig.badgeText}`}>{statusConfig.label}</span>
                  </div>
                </div>
                {isRejected && item.rejection_reason && (
                  <div className="px-4 pb-3 pt-0">
                    <p className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100">
                      <strong>Reason:</strong> {item.rejection_reason}
                    </p>
                  </div>
                )}
                {item.proof_url && (
                  <div className="px-4 pb-3 pt-0 flex gap-2">
                    <a href={item.proof_url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-semibold text-indigo-600 hover:underline">
                      View Submitted Proof ↗
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden font-sans" style={{ background: '#eef1f7' }}>
      {/* Sidebar — Dark Navy */}
      <aside className="w-60 flex flex-col flex-shrink-0 z-20" style={{ background: '#1a1f2e' }}>
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
            <p className="text-xs leading-tight" style={{ color: '#8b92a5' }}>STUDENT PORTAL</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-1">
          <p className="text-xs font-semibold px-3 mb-3 uppercase" style={{ color: '#8b92a5', letterSpacing: '0.08em', fontSize: '10px' }}>Menu</p>
          <button
            onClick={() => setActiveSection('details')}
            className={navClass('details')}
            style={navStyle('details')}
            onMouseEnter={(e) => { if (activeSection !== 'details') { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#ffffff'; } }}
            onMouseLeave={(e) => { if (activeSection !== 'details') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8b92a5'; } }}
          >
            <PersonIcon fontSize="small" /> My Details
          </button>
          <button
            onClick={() => setActiveSection('applied')}
            className={navClass('applied')}
            style={navStyle('applied')}
            onMouseEnter={(e) => { if (activeSection !== 'applied') { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#ffffff'; } }}
            onMouseLeave={(e) => { if (activeSection !== 'applied') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8b92a5'; } }}
          >
            <WorkIcon fontSize="small" /> Applied Companies
          </button>
          <button
            onClick={() => setActiveSection('applicable')}
            className={navClass('applicable')}
            style={navStyle('applicable')}
            onMouseEnter={(e) => { if (activeSection !== 'applicable') { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#ffffff'; } }}
            onMouseLeave={(e) => { if (activeSection !== 'applicable') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8b92a5'; } }}
          >
            <BusinessIcon fontSize="small" /> Applicable Companies
          </button>
          <button
            onClick={() => setActiveSection('skills')}
            className={navClass('skills')}
            style={navStyle('skills')}
            onMouseEnter={(e) => { if (activeSection !== 'skills') { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#ffffff'; } }}
            onMouseLeave={(e) => { if (activeSection !== 'skills') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8b92a5'; } }}
          >
            <SkillsIcon fontSize="small" /> My Skills
          </button>
          <button
            onClick={() => setActiveSection('activity')}
            className={navClass('activity')}
            style={navStyle('activity')}
            onMouseEnter={(e) => { if (activeSection !== 'activity') { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#ffffff'; } }}
            onMouseLeave={(e) => { if (activeSection !== 'activity') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8b92a5'; } }}
          >
            <ActivityIcon fontSize="small" /> Activity Points
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Navbar */}
        <header
          className="h-16 flex items-center justify-between px-6 flex-shrink-0 z-10"
          style={{ background: '#ffffff', borderBottom: '1px solid #e2e6ea' }}
        >
          <h2 className="text-base font-semibold" style={{ color: '#111827' }}>Student Dashboard</h2>
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
              <p className="text-sm font-medium" style={{ color: '#111827' }}>{profile?.full_name || 'Student'}</p>
              <p className="text-xs" style={{ color: '#6b7280' }}>{profile?.register_number || 'Student'}</p>
            </div>
            {/* Avatar — click to change password */}
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #6c47ff, #9c74ff)', color: '#ffffff' }}
              onClick={() => setPwDialogOpen(true)}
              title="Change Password"
            >
              {profile?.full_name?.[0]?.toUpperCase() || 'S'}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-8">
          <div className="max-w-6xl mx-auto">
            {activeSection === 'details' && renderMyDetails()}
            {activeSection === 'applied' && renderAppliedCompanies()}
            {activeSection === 'applicable' && renderApplicableCompanies()}
            {activeSection === 'skills' && renderSkills()}
            {activeSection === 'activity' && renderActivityPoints()}
          </div>
        </main>
      </div>

      {/* Resume Upload/Edit Dialog */}
      <Dialog open={resumeDialogOpen} onClose={() => setResumeDialogOpen(false)}>
        <DialogTitle>{isEditingResume ? 'Update Resume (New Version)' : 'Upload New Resume'}</DialogTitle>
        <DialogContent sx={{ pt: 2, minWidth: 400 }}>
          <div className="flex flex-col gap-4 mt-2">
            {isEditingResume && resumes.length > 1 && (
              <FormControl fullWidth size="small">
                <InputLabel>Select Resume to Update</InputLabel>
                <Select
                  value={resumeForm.resumeId}
                  label="Select Resume to Update"
                  name="resumeId"
                  onChange={handleResumeInputChange}
                >
                  {resumes.map((r) => (
                    <MenuItem key={r.resume_id} value={r.resume_id}>{r.resume_title}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            <TextField label="Resume Title" name="title" fullWidth value={resumeForm.title} onChange={handleResumeInputChange} />
            <TextField
              label="File URL (Simulated)"
              name="url"
              fullWidth
              value={resumeForm.url}
              onChange={handleResumeInputChange}
              placeholder="https://drive.google.com/..."
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResumeDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleResumeSubmit} variant="contained">{isEditingResume ? 'Update' : 'Upload'}</Button>
        </DialogActions>
      </Dialog>

      {/* Apply — Resume Picker Dialog (shown when student has multiple resumes) */}
      <Dialog open={applyDialogOpen} onClose={() => setApplyDialogOpen(false)}>
        <DialogTitle>Select Resume to Apply With</DialogTitle>
        <DialogContent sx={{ pt: 2, minWidth: 360 }}>
          <p className="text-sm text-gray-500 mb-4">You have multiple resumes. Please choose one for this application.</p>
          <FormControl fullWidth size="small">
            <InputLabel>Resume</InputLabel>
            <Select
              value={selectedResumeId}
              label="Resume"
              onChange={(e) => setSelectedResumeId(e.target.value)}
            >
              {resumes.map((r) => (
                <MenuItem key={r.resume_id} value={r.resume_id}>{r.resume_title}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApplyDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleApplyDialogConfirm} variant="contained" disabled={!selectedResumeId}>
            Apply Now
          </Button>
        </DialogActions>
      </Dialog>

      {/* Password Change Dialog */}
      <Dialog open={pwDialogOpen} onClose={() => { setPwDialogOpen(false); setPwError(''); setPwSuccess(''); }}>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent sx={{ pt: 2, minWidth: 380 }}>
          <div className="flex flex-col gap-3 mt-2">
            {pwError && <Alert severity="error">{pwError}</Alert>}
            {pwSuccess && <Alert severity="success">{pwSuccess}</Alert>}
            <TextField label="Current Password" type="password" fullWidth size="small" value={pwForm.currentPassword} onChange={e => setPwForm(f => ({...f, currentPassword: e.target.value}))} />
            <TextField label="New Password" type="password" fullWidth size="small" value={pwForm.newPassword} onChange={e => setPwForm(f => ({...f, newPassword: e.target.value}))} />
            <TextField label="Confirm New Password" type="password" fullWidth size="small" value={pwForm.confirmPassword} onChange={e => setPwForm(f => ({...f, confirmPassword: e.target.value}))} />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setPwDialogOpen(false); setPwError(''); setPwSuccess(''); }}>Cancel</Button>
          <Button onClick={handleChangePassword} variant="contained" disabled={pwLoading} sx={{ background: '#6c47ff', '&:hover': { background: '#5534e0' } }}>{pwLoading ? 'Changing...' : 'Change Password'}</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default StudentDashboard;