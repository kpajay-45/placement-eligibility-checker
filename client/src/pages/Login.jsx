import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import {
  Button,
  TextField,
  Alert,
  Link as MuiLink
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
      
      // Save Token & Role to LocalStorage (Critical for ProtectedRoute)
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-sm w-full bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Placement Portal Login
        </h1>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            variant="outlined"
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
          />
          <Button 
            type="submit" 
            fullWidth 
            variant="contained" 
            size="large" 
            sx={{ mt: 1 }}
          >
            Login
          </Button>
        </form>
        
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <MuiLink component={Link} to="/register" underline="hover">Register here</MuiLink>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;