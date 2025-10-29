import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import LockIcon from '@mui/icons-material/Lock';

import { useAuth } from '../context/AuthContext.jsx';

const AdminRegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    address: '',
    phone: '',
    role: 'admin',
    adminAccessCode: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError(null);
      const user = await register(form);
      
      if (user.role !== 'admin') {
        setError('Failed to create admin account. Please contact system administrator.');
        return;
      }
      
      navigate('/admin');
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to create admin account';
      const validationErrors = err.response?.data?.errors;
      
      if (validationErrors && Array.isArray(validationErrors)) {
        const errorList = validationErrors.map(e => e.msg).join(', ');
        setError(`Validation failed: ${errorList}`);
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f8fafc',
        py: 4
      }}
    >
      <Container maxWidth="sm">
        <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <LockIcon sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1, color: 'primary.main' }}>
              Admin Registration
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Create an administrator account to manage municipal complaints.
            </Typography>
          </Box>

          <Alert severity="warning" sx={{ mb: 3 }}>
            Admin accounts have elevated privileges. Only authorized personnel should register.
          </Alert>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Stack component="form" spacing={3} onSubmit={handleSubmit}>
          <TextField
            label="Full Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            fullWidth
          />

          <TextField
            label="Official Email"
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            fullWidth
          />

          <TextField
            label="Password"
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            fullWidth
            helperText="Use 6 or more characters."
          />

          <TextField
            label="Admin Access Code"
            type="password"
            name="adminAccessCode"
            value={form.adminAccessCode}
            onChange={handleChange}
            required
            fullWidth
            helperText="Enter the secure admin access code provided by your organization."
          />

          <TextField
            label="Office Address"
            name="address"
            value={form.address}
            onChange={handleChange}
            fullWidth
          />

          <TextField
            label="Contact Number"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            fullWidth
          />

          <Button type="submit" variant="contained" size="large" color="warning" disabled={loading}>
            {loading ? 'Creating admin account…' : 'Create admin account'}
          </Button>
        </Stack>

        <Divider sx={{ my: 3 }} />

        <Stack spacing={2}>
          <Typography variant="body2" sx={{ textAlign: 'center' }}>
            Already have an admin account? <Link to="/admin/login">Admin sign in</Link>
          </Typography>
          <Typography variant="body2" sx={{ textAlign: 'center' }}>
            Not an admin? <Link to="/register">Citizen registration</Link>
          </Typography>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default AdminRegisterPage;
