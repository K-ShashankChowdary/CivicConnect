import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';

import { useAuth } from '../context/AuthContext.jsx';

const categories = [
  'Water Supply',
  'Sanitation',
  'Waste Management',
  'Roads & Transport',
  'Electricity',
  'Street Lighting',
  'Public Safety',
  'Noise Pollution',
  'Air Quality',
  'Drainage',
  'Animal Control',
  'Public Transport',
  'Traffic',
  'Building Maintenance',
  'Parks & Recreation'
];


const SubmitComplaintPage = () => {
  const { api } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '',
    category: '',
    description: '',
    location: ''
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };


  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      await api.post('/complaints', form);

      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit complaint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box
        sx={{
          background: 'linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%)',
          borderRadius: 3,
          p: 4,
          mb: 4,
          color: 'white',
          boxShadow: '0 4px 20px rgba(6, 182, 212, 0.3)',
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1.5 }}>
          Submit Complaint
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.95 }}>
          Our intelligent AI system will analyze and prioritize your complaint automatically
        </Typography>
      </Box>

      <Paper 
        elevation={0} 
        sx={{ 
          p: 4, 
          borderRadius: 3, 
          border: '1px solid', 
          borderColor: 'divider',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
        }}
      >

      <Stack component="form" spacing={3} onSubmit={handleSubmit}>
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success">Complaint submitted successfully. Redirecting…</Alert>
        )}

        <Stack spacing={3}>
          <TextField
            label="Title"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            fullWidth
            placeholder="Brief summary of the issue"
          />
          
          <TextField
            select
            label="Category"
            name="category"
            value={form.category}
            onChange={handleChange}
            required
            fullWidth
            sx={{ minWidth: 250 }}
          >
            {categories.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
          
          <TextField
            label="Location"
            name="location"
            value={form.location}
            onChange={handleChange}
            required
            fullWidth
            placeholder="Street address or landmark"
          />
          
          <TextField
            label="Detailed description"
            name="description"
            value={form.description}
            onChange={handleChange}
            required
            fullWidth
            multiline
            minRows={5}
            placeholder="Provide a detailed description of the issue, including location specifics, severity, and any immediate concerns."
          />
        </Stack>

        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button variant="outlined" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" size="large" disabled={loading}>
            {loading ? 'Submitting…' : 'Submit complaint'}
          </Button>
        </Stack>
      </Stack>
    </Paper>
    </Box>
  );
};

export default SubmitComplaintPage;
