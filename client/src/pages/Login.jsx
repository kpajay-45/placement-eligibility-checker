import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import {
  Button,
  TextField,
  Alert,
  Link as MuiLink,
  Box,
  Typography,
} from '@mui/material';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/auth/login', formData);
      
      // Save Token & Role to LocalStorage
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.role);

      // Update global auth state
      login(res.data.token, res.data.role);
      
      // Redirect based on role
      if (res.data.role === 'STUDENT') {
        navigate('/student');
      } else if (res.data.role === 'PLACEMENT_STAFF') {
        navigate('/staff');
      } else if (res.data.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
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

        {/* Right Panel: Login Form */}
        <div className="flex flex-col justify-center items-center w-full md:w-1/2 p-8 lg:p-14">
          <div className="w-full max-w-sm">
            <Box sx={{ mb: 5, textAlign: 'center' }}>
              <Typography variant="h4" sx={{ color: '#1e293b', mb: 1, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>
                User Login
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
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
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
                value={formData.password}
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
              
              <div className="flex items-center justify-between px-1">
                <label className="flex items-center text-sm text-gray-500 cursor-pointer">
                  <input type="checkbox" className="mr-2 rounded text-indigo-600 focus:ring-indigo-600" />
                  Remember me
                </label>
                <MuiLink 
                  component={Link} 
                  to="#" 
                  underline="hover"
                  sx={{ color: '#64748b', fontSize: '0.875rem' }}
                >
                  Forgot password?
                </MuiLink>
              </div>

              <Button 
                type="submit" 
                fullWidth 
                variant="contained" 
                size="large" 
                sx={{ 
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
                Login
              </Button>
            </form>
            
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <MuiLink 
                component={Link} 
                to="/register" 
                underline="none"
                sx={{ 
                  color: '#4f46e5',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  transition: 'color 0.2s',
                  '&:hover': { color: '#3730a3' }
                }}
              >
                Create Account
              </MuiLink>
            </Box>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;