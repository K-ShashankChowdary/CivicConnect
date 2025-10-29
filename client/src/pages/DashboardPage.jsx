import { useCallback, useEffect, useState } from 'react';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid2';

import ComplaintCard from '../components/ComplaintCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import useDebounce from '../hooks/useDebounce.js';

const statusOptions = [
  { label: 'All statuses', value: '' },
  { label: 'Submitted', value: 'submitted' },
  { label: 'In progress', value: 'in_progress' },
  { label: 'Resolved', value: 'resolved' }
];

const priorityOptions = [
  { label: 'All priorities', value: '' },
  { label: 'Critical', value: 'Critical' },
  { label: 'High', value: 'High' },
  { label: 'Medium', value: 'Medium' },
  { label: 'Low', value: 'Low' }
];

const DashboardPage = () => {
  const { api } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    q: '',
    status: '',
    priorityLevel: ''
  });

  const debouncedQuery = useDebounce(filters.q, 400);

  const fetchComplaints = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};

      if (filters.status) params.status = filters.status;
      if (filters.priorityLevel) params.priorityLevel = filters.priorityLevel;
      if (debouncedQuery) params.q = debouncedQuery;

      const { data } = await api.get('/complaints', { params });
      setComplaints(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load complaints');
    } finally {
      setLoading(false);
    }
  }, [api, debouncedQuery, filters.priorityLevel, filters.status]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({ q: '', status: '', priorityLevel: '' });
  };

  if (loading && complaints.length === 0) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ minHeight: '60vh' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading your complaints…</Typography>
      </Stack>
    );
  }

  if (error) {
    return (
      <Stack spacing={2} alignItems="center" sx={{ minHeight: '60vh' }}>
        <Alert severity="error">{error}</Alert>
        <Button variant="contained" onClick={fetchComplaints}>
          Retry
        </Button>
      </Stack>
    );
  }

  return (
    <Stack spacing={4}>
      <Box
        sx={{
          background: 'linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%)',
          borderRadius: 3,
          p: 4,
          color: 'white',
          boxShadow: '0 4px 20px rgba(6, 182, 212, 0.3)',
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <div>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              My Complaints
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Track and manage your submitted complaints
            </Typography>
          </div>
          <Button 
            variant="contained" 
            href="/submit" 
            size="large"
            sx={{
              bgcolor: 'white',
              color: 'primary.main',
              fontWeight: 600,
              '&:hover': {
                bgcolor: 'grey.100',
              }
            }}
          >
            + New Complaint
          </Button>
        </Stack>
      </Box>

      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          borderRadius: 3, 
          border: '1px solid', 
          borderColor: 'divider',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
        }}
      >
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Filter & Search
            </Typography>
            <Button variant="text" size="small" onClick={resetFilters} sx={{ fontWeight: 600 }}>
              Reset
            </Button>
          </Stack>

          <Grid container spacing={2}>
            <Grid xs={12} md={6}>
              <TextField
                label="Search"
                name="q"
                value={filters.q}
                onChange={handleFilterChange}
                placeholder="Search title, description, location..."
                fullWidth
              />
            </Grid>
            <Grid xs={6} md={3}>
              <TextField
                select
                label="Status"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                fullWidth
                sx={{ minWidth: 150 }}
              >
                {statusOptions.map((option) => (
                  <MenuItem key={option.value || 'all'} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid xs={6} md={3}>
              <TextField
                select
                label="Priority"
                name="priorityLevel"
                value={filters.priorityLevel}
                onChange={handleFilterChange}
                fullWidth
                sx={{ minWidth: 150 }}
              >
                {priorityOptions.map((option) => (
                  <MenuItem key={option.value || 'all'} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </Stack>
      </Paper>

      {loading ? (
        <Stack alignItems="center" py={4}>
          <CircularProgress size={32} />
        </Stack>
      ) : complaints.length === 0 ? (
        <Alert severity="info">
          {filters.q || filters.status || filters.priorityLevel
            ? 'No complaints match your filters'
            : 'You have not submitted any complaints yet'}
        </Alert>
      ) : (
        <Stack spacing={3}>
          {complaints.map((complaint) => (
            <ComplaintCard key={complaint._id} complaint={complaint} />
          ))}
        </Stack>
      )}
    </Stack>
  );
};

export default DashboardPage;
