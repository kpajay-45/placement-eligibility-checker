import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import {
  Button,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Link as MuiLink,
  Box,
  Typography,
  Alert
} from '@mui/material';

const Register = () => {
  const [role, setRole] = useState('STUDENT');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    // Staff field only
    designation: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const payload = {
      email: formData.email,
      password: formData.password,
      role: role,
      profile: {}
    };

    if (role === 'STUDENT') {
      payload.profile = {};
    } else {
      payload.profile = {
        designation: formData.designation
      };
    }

    try {
      await api.post('/auth/register', payload);
      alert('Registration successful! Please login.');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 font-sans p-4">
      {/* Central Card Container */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 flex flex-col md:flex-row w-full max-w-5xl overflow-hidden animate-fade-in-up">
        
        {/* Left Panel: Illustration */}
        <div className="hidden md:flex flex-col justify-center items-center w-1/2 bg-gradient-to-br from-indigo-50 to-blue-50 p-12">
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h4" fontWeight="bold" sx={{ color: '#4f46e5', mb: 1, letterSpacing: '0.05em' }}>
              Placement Portal
            </Typography>
            <Typography variant="body2" sx={{ color: '#6366f1', opacity: 0.8 }}>
              Unlock your career potential with top recruiters.
            </Typography>
          </Box>
          <img 
            src="/images/placement_illustration.png" 
            alt="Students and Professionals" 
            className="w-full h-auto max-w-sm drop-shadow-lg"
          />
        </div>

        {/* Right Panel: Register Form */}
        <div className="flex flex-col justify-center items-center w-full md:w-1/2 p-8 lg:p-14">
          <div className="w-full max-w-sm">
            <Box sx={{ mb: 4, textAlign: 'center' }}>
              <Typography variant="h4" sx={{ color: '#1e293b', mb: 1, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>
                Create Account
              </Typography>
            </Box>
            
            {error && (
              <Alert 
                severity="error" 
                sx={{ mb: 3, borderRadius: '8px' }}
              >
                {error}
              </Alert>
            )}

            <Box sx={{ mb: 4 }}>
              <FormControl component="fieldset" fullWidth>
                <FormLabel 
                  component="legend" 
                  sx={{ 
                    mb: 1.5, 
                    fontWeight: 600, 
                    color: '#64748b', 
                    fontSize: '0.9rem',
                    textAlign: 'center',
                    '&.Mui-focused': { color: '#64748b' }
                  }}
                >
                  I am registering as a:
                </FormLabel>
                <RadioGroup 
                  row 
                  value={role} 
                  onChange={(e) => setRole(e.target.value)}
                  sx={{ 
                    display: 'flex', 
                    gap: 1.5,
                    justifyContent: 'center'
                  }}
                >
                  {['STUDENT', 'PLACEMENT_STAFF'].map((roleOption) => (
                    <FormControlLabel 
                      key={roleOption}
                      value={roleOption} 
                      control={
                        <Radio 
                          sx={{ 
                            color: '#cbd5e1',
                            p: 1,
                            '&.Mui-checked': { color: '#4f46e5' }
                          }} 
                        />
                      } 
                      label={
                        <span className={`font-semibold text-sm ${role === roleOption ? 'text-indigo-600' : 'text-slate-500'}`}>
                          {roleOption === 'STUDENT' ? 'Student' : 'Staff'}
                        </span>
                      }
                      sx={{
                        m: 0,
                        px: 1.5,
                        py: 0.5,
                        border: '2px solid',
                        borderColor: role === roleOption ? '#4f46e5' : 'transparent',
                        borderRadius: '50px',
                        backgroundColor: role === roleOption ? '#eef2ff' : '#f8fafc',
                        flex: 1,
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                      }}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            </Box>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <TextField 
                fullWidth 
                label="Email" 
                name="email" 
                type="email" 
                onChange={handleChange} 
                required 
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '50px',
                    backgroundColor: '#f8fafc',
                    '& fieldset': { borderColor: 'transparent' },
                    '&:hover fieldset': { borderColor: '#a5b4fc' },
                    '&.Mui-focused fieldset': { borderColor: '#4f46e5' },
                  }
                }}
              />
              <TextField 
                fullWidth 
                label="Password" 
                name="password" 
                type="password" 
                onChange={handleChange} 
                required 
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '50px',
                    backgroundColor: '#f8fafc',
                    '& fieldset': { borderColor: 'transparent' },
                    '&:hover fieldset': { borderColor: '#a5b4fc' },
                    '&.Mui-focused fieldset': { borderColor: '#4f46e5' },
                  }
                }}
              />

              {role === 'PLACEMENT_STAFF' && (
                <Box className="animate-fade-in-up" sx={{ animationDuration: '0.3s' }}>
                  <TextField 
                    fullWidth 
                    label="Designation" 
                    name="designation" 
                    onChange={handleChange} 
                    required 
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '50px',
                        backgroundColor: '#f8fafc',
                        '& fieldset': { borderColor: 'transparent' },
                        '&:hover fieldset': { borderColor: '#a5b4fc' },
                        '&.Mui-focused fieldset': { borderColor: '#4f46e5' },
                      }
                    }}
                  />
                  <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#f59e0b', fontWeight: 500, textAlign: 'center' }}>
                    <span aria-hidden="true">ⓘ</span> Staff accounts require Admin approval.
                  </Typography>
                </Box>
              )}

              <Button 
                type="submit" 
                fullWidth 
                variant="contained" 
                size="large" 
                sx={{ 
                  mt: 2,
                  py: 1.5,
                  borderRadius: '50px',
                  fontSize: '1.1rem',
                  textTransform: 'uppercase',
                  fontWeight: 'bold',
                  letterSpacing: '1px',
                  backgroundColor: '#4f46e5',
                  boxShadow: '0 4px 14px 0 rgba(79, 70, 229, 0.39)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: '#4338ca',
                    boxShadow: '0 6px 20px rgba(79, 70, 229, 0.23)',
                    transform: 'translateY(-1px)'
                  }
                }}
              >
                Register
              </Button>
            </form>
            
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <MuiLink 
                component={Link} 
                to="/" 
                underline="none"
                sx={{ 
                  color: '#4f46e5',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  transition: 'color 0.2s',
                  '&:hover': { color: '#3730a3' }
                }}
              >
                Login
              </MuiLink>
            </Box>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;