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

const AdminLoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
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
      const user = await login(form);
      
      if (user.role !== 'admin') {
        setError('Access denied. Admin credentials required.');
        return;
      }
      
      navigate('/admin');
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Admin login failed. Please try again.';
      const validationErrors = err.response?.data?.errors;
      
      if (validationErrors && Array.isArray(validationErrors)) {
        const errorList = validationErrors.map(e => e.msg).join('. ');
        setError(errorList);
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
              Admin Portal
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Secure access for municipal administrators only.
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

        <Stack component="form" spacing={3} onSubmit={handleSubmit}>
          <TextField
            label="Admin Email"
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            fullWidth
          />

          <TextField
            label="Admin Password"
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            fullWidth
          />

          <Button type="submit" variant="contained" size="large" color="warning" disabled={loading}>
            {loading ? 'Authenticating…' : 'Admin Sign in'}
          </Button>
        </Stack>

        <Divider sx={{ my: 3 }} />

        <Stack spacing={2}>
          <Typography variant="body2" sx={{ textAlign: 'center' }}>
            New admin? <Link to="/admin/register">Register admin account</Link>
          </Typography>
          <Typography variant="body2" sx={{ textAlign: 'center' }}>
            Not an admin? <Link to="/login">Citizen login</Link>
          </Typography>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default AdminLoginPage;
