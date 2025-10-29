import { useCallback, useEffect, useMemo, useState } from 'react';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid2';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';

import { useAuth } from '../context/AuthContext.jsx';
import ComplaintCard from '../components/ComplaintCard.jsx';
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

const AdminComplaintsPage = () => {
  const { api } = useAuth();

  const [complaints, setComplaints] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filters, setFilters] = useState({
    q: '',
    status: '',
    priorityLevel: '',
    sortBy: 'priorityScore',
    sortDirection: 'desc'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const debouncedQuery = useDebounce(filters.q, 400);

  const fetchComplaints = useCallback(
    async (page = meta.page) => {
      try {
        setLoading(true);
        setError(null);
        const params = {
          page,
          limit: 12,
          sortBy: filters.sortBy,
          sortDirection: filters.sortDirection
        };

        if (filters.status) params.status = filters.status;
        if (filters.priorityLevel) params.priorityLevel = filters.priorityLevel;
        if (debouncedQuery) params.q = debouncedQuery;

        const { data } = await api.get('/admin/complaints', { params });
        setComplaints(data.data.items);
        setMeta({
          page: data.data.page,
          totalPages: data.data.totalPages,
          total: data.data.total
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load complaints');
      } finally {
        setLoading(false);
      }
    },
    [api, debouncedQuery, filters.priorityLevel, filters.sortBy, filters.sortDirection, filters.status, meta.page]
  );

  useEffect(() => {
    fetchComplaints(1);
  }, [fetchComplaints]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({ q: '', status: '', priorityLevel: '', sortBy: 'priorityScore', sortDirection: 'desc' });
  };

  useEffect(() => {
    const handle = setTimeout(() => {
      fetchComplaints(1);
    }, 0);

    return () => clearTimeout(handle);
  }, [filters.priorityLevel, filters.sortBy, filters.sortDirection, filters.status, debouncedQuery, fetchComplaints]);

  const updateStatus = async (complaintId, status) => {
    try {
      setLoading(true);
      await api.patch(`/admin/complaints/${complaintId}`, { status });
      await fetchComplaints(meta.page);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const cards = useMemo(
    () =>
      complaints.map((complaint) => {
        const actions = [];

        if (complaint.status === 'submitted') {
          actions.push({
            key: 'start',
            element: (
              <Button
                variant="contained"
                size="small"
                onClick={() => updateStatus(complaint._id, 'in_progress')}
              >
                Mark in progress
              </Button>
            )
          });
        }

        if (complaint.status !== 'resolved') {
          actions.push({
            key: 'resolve',
            element: (
              <Button
                variant="outlined"
                size="small"
                color="success"
                onClick={() => updateStatus(complaint._id, 'resolved')}
              >
                Mark resolved
              </Button>
            )
          });
        }

        return (
          <ComplaintCard key={complaint._id} complaint={complaint} actions={actions} />
        );
      }),
    [complaints]
  );

  return (
    <Stack spacing={3}>
      <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
        <Stack spacing={3}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="flex-start" spacing={2}>
            <div>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                City-wide complaints overview
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Search and triage complaints. AI-priority scores help you focus on the most urgent cases.
              </Typography>
            </div>
            <Button variant="outlined" onClick={resetFilters}>
              Reset filters
            </Button>
          </Stack>

          <Grid container spacing={2}>
            <Grid xs={12} md={4}>
              <TextField
                label="Search"
                name="q"
                value={filters.q}
                onChange={handleFilterChange}
                placeholder="Search title, description, location"
                fullWidth
              />
            </Grid>
            <Grid xs={6} md={2}>
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
            <Grid xs={6} md={2}>
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
            <Grid xs={6} md={2}>
              <TextField
                select
                label="Sort by"
                name="sortBy"
                value={filters.sortBy}
                onChange={handleFilterChange}
                fullWidth
                sx={{ minWidth: 150 }}
              >
                <MenuItem value="priorityScore">Priority score</MenuItem>
                <MenuItem value="createdAt">Newest first</MenuItem>
              </TextField>
            </Grid>
            <Grid xs={6} md={2}>
              <TextField
                select
                label="Direction"
                name="sortDirection"
                value={filters.sortDirection}
                onChange={handleFilterChange}
                fullWidth
                sx={{ minWidth: 120 }}
              >
                <MenuItem value="desc">Descending</MenuItem>
                <MenuItem value="asc">Ascending</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ p: 0 }}>
        <Divider sx={{ mb: 2 }} />
        {loading ? (
          <Stack alignItems="center" justifyContent="center" sx={{ minHeight: '40vh' }}>
            <CircularProgress />
            <Typography sx={{ mt: 2 }}>Loading complaints…</Typography>
          </Stack>
        ) : error ? (
          <Stack spacing={2} alignItems="center">
            <Alert severity="error">{error}</Alert>
            <Button variant="contained" onClick={() => fetchComplaints(meta.page)}>
              Retry
            </Button>
          </Stack>
        ) : complaints.length === 0 ? (
          <Alert severity="info">No complaints matched the current filters.</Alert>
        ) : (
          <Stack spacing={3}>
            <Stack spacing={3}>
              {cards}
            </Stack>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Showing page {meta.page} of {meta.totalPages} · {meta.total} complaints total
              </Typography>
              <Stack direction="row" spacing={2}>
                <Button
                  variant="outlined"
                  disabled={meta.page <= 1 || loading}
                  onClick={() => fetchComplaints(meta.page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="contained"
                  disabled={meta.page >= meta.totalPages || loading}
                  onClick={() => fetchComplaints(meta.page + 1)}
                >
                  Next
                </Button>
              </Stack>
            </Stack>
          </Stack>
        )}
      </Paper>
    </Stack>
  );
};

export default AdminComplaintsPage;
