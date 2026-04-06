import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  Chip,
  Divider,
  Paper,
  Grid
} from '@mui/material';
import { BusinessCenter, CheckCircle } from '@mui/icons-material';
import api from '../services/api';

const StudentProfileModal = ({ open, onClose, studentId, userRole }) => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStudentDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = `/${userRole}/students/${studentId}/full`;
      const response = await api.get(endpoint);
      setProfileData(response.data);
    } catch (err) {
      console.error('Error fetching student details:', err);
      setError(err.response?.data?.message || 'Failed to load student details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && studentId) {
      fetchStudentDetails();
    } else {
      setProfileData(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, studentId]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ backgroundColor: '#f3f4f6', pb: 2 }}>
        <Typography component="span" variant="h6" fontWeight="bold">Student Profile Details</Typography>
      </DialogTitle>
      <DialogContent dividers sx={{ minHeight: '300px' }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error" align="center">{error}</Typography>
        ) : profileData ? (
          <Grid container spacing={3}>
            {/* Header / Basic Info */}
            <Grid item xs={12}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography variant="h5" fontWeight="bold" gutterBottom>{profileData.full_name}</Typography>
                  <Typography variant="body1" color="textSecondary">{profileData.register_number} • {profileData.department}</Typography>
                  <Typography variant="body2" color="textSecondary">{profileData.email}</Typography>
                </Box>
                <Chip 
                  label={profileData.status} 
                  color={profileData.status === 'ACTIVE' ? 'success' : 'error'} 
                  variant="outlined" 
                />
              </Box>
            </Grid>

            {/* Academic Stats */}
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f9fafb' }}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>Academic Overview</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="h6">{Number(profileData.cgpa).toFixed(2)}</Typography>
                    <Typography variant="body2" color="textSecondary">CGPA</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="h6">{profileData.semester}</Typography>
                    <Typography variant="body2" color="textSecondary">Semester</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="h6">{profileData.history_of_arrears || 0}</Typography>
                    <Typography variant="body2" color="textSecondary">Backlogs</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="h6">{profileData.batch_year || 'N/A'}</Typography>
                    <Typography variant="body2" color="textSecondary">Batch</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="h6">{profileData.attendance_percentage != null ? `${Number(profileData.attendance_percentage).toFixed(1)}%` : 'N/A'}</Typography>
                    <Typography variant="body2" color="textSecondary">Attendance</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="h6">{profileData.marks_10th != null ? `${Number(profileData.marks_10th).toFixed(1)}%` : 'N/A'}</Typography>
                    <Typography variant="body2" color="textSecondary">10th Marks</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="h6">{profileData.marks_12th != null ? `${Number(profileData.marks_12th).toFixed(1)}%` : 'N/A'}</Typography>
                    <Typography variant="body2" color="textSecondary">12th Marks</Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Semester SGPA */}
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f9fafb' }}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>Semester-wise SGPA</Typography>
                <Grid container spacing={1}>
                  {[1,2,3,4,5,6,7,8].map(sem => {
                    const val = profileData[`sgpa_sem${sem}`];
                    const currentSem = parseInt(profileData.semester) || 0;
                    const reached = sem <= currentSem;
                    return (
                      <Grid item xs={3} sm={1.5} key={sem}>
                        <Box textAlign="center" p={1} borderRadius={1}
                          sx={{ bgcolor: reached && val != null ? '#e0f2fe' : '#f3f4f6', border: '1px solid', borderColor: reached && val != null ? '#7dd3fc' : '#e5e7eb' }}
                        >
                          <Typography variant="subtitle2" fontWeight="bold" color={reached && val != null ? 'primary' : 'textSecondary'}>
                            {val != null ? Number(val).toFixed(2) : '—'}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">Sem {sem}</Typography>
                        </Box>
                      </Grid>
                    );
                  })}
                </Grid>
              </Paper>
            </Grid>

            {/* Skills */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                <BusinessCenter sx={{ fontSize: 18, mr: 1, verticalAlign: 'text-bottom' }} />
                Skills & Technologies
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {profileData.skills && profileData.skills.length > 0 ? (
                  profileData.skills.map((skill, index) => (
                    <Chip 
                      key={index} 
                      label={skill.skill_name} 
                      variant="filled" 
                      color="primary" 
                      size="small" 
                      component={skill.certificate_url ? 'a' : 'div'}
                      href={skill.certificate_url || undefined}
                      target={skill.certificate_url ? "_blank" : undefined}
                      clickable={!!skill.certificate_url}
                    />
                  ))
                ) : (
                  <Typography variant="body2" color="textSecondary" fontStyle="italic">No skills added yet.</Typography>
                )}
              </Box>
            </Grid>

            <Grid item xs={12}><Divider /></Grid>

            {/* Activity Points */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                <CheckCircle sx={{ fontSize: 18, mr: 1, verticalAlign: 'text-bottom' }} />
                Extracurricular Activity Points
              </Typography>
              
              {profileData.activityPoints && profileData.activityPoints.length > 0 ? (
                <Grid container spacing={2}>
                  {profileData.activityPoints.map((ap, index) => (
                    <Grid item xs={12} sm={6} key={index}>
                      <Paper variant="outlined" sx={{ p: 1.5 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                          <Typography variant="body2" fontWeight="bold">{ap.activity_type}</Typography>
                          <Chip 
                            label={`+${ap.points} pts`} 
                            size="small" 
                            color={ap.status === 'APPROVED' ? 'success' : ap.status === 'PENDING' ? 'warning' : 'error'} 
                          />
                        </Box>
                        {ap.proof_url && (
                          <Typography variant="caption">
                            <a href={ap.proof_url} target="_blank" rel="noopener noreferrer">View Proof</a>
                          </Typography>
                        )}
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Typography variant="body2" color="textSecondary" fontStyle="italic">No activity points recorded.</Typography>
              )}
            </Grid>

          </Grid>
        ) : null}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="contained" color="inherit">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StudentProfileModal;
