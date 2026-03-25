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
  Link as MuiLink
} from '@mui/material';

const Register = () => {
  const [role, setRole] = useState('STUDENT');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    // Staff field only
    designation: ''
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const payload = {
      email: formData.email,
      password: formData.password,
      role: role,
      profile: {}
    };

    if (role === 'STUDENT') {
      payload.profile = {
        // No extra fields for student registration
      };
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
      alert(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Create Account
        </h1>
        
        <div className="mb-6 flex justify-center">
          <FormControl component="fieldset">
            <FormLabel component="legend" className="text-center mb-2">Select Role</FormLabel>
            <RadioGroup row value={role} onChange={(e) => setRole(e.target.value)}>
              <FormControlLabel value="STUDENT" control={<Radio />} label="Student" />
              <FormControlLabel value="PLACEMENT_STAFF" control={<Radio />} label="Placement Staff" />
            </RadioGroup>
          </FormControl>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            <TextField fullWidth label="Email Address" name="email" type="email" onChange={handleChange} required />
            <TextField fullWidth label="Password" name="password" type="password" onChange={handleChange} required />

            {role === 'STUDENT' && (
              <>
                {/* No extra fields for Student */}
              </>
            )}

            {role === 'PLACEMENT_STAFF' && (
              <>
                <TextField fullWidth label="Designation" name="designation" onChange={handleChange} required />
                <p className="text-xs text-gray-500 mt-1">Note: Staff accounts require Admin approval before login.</p>
              </>
            )}

            <Button type="submit" fullWidth variant="contained" color="success" size="large" sx={{ mt: 2 }}>Register</Button>
        </form>
        
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Already have an account? <MuiLink component={Link} to="/">Login here</MuiLink>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;