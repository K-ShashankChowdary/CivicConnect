import { useCallback, useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Grid2";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";

import { useAuth } from "../context/AuthContext.jsx";
import ComplaintCard from "../components/ComplaintCard.jsx";
import useDebounce from "../hooks/useDebounce.js";

const statusOptions = [
  { label: "All statuses", value: "" },
  { label: "Submitted", value: "submitted" },
  { label: "In progress", value: "in_progress" },
  { label: "Resolved", value: "resolved" },
];

const priorityOptions = [
  { label: "All priorities", value: "" },
  { label: "Critical", value: "Critical" },
  { label: "High", value: "High" },
  { label: "Medium", value: "Medium" },
  { label: "Low", value: "Low" },
];

const AdminComplaintsPage = () => {
  const { api } = useAuth();

  const [complaints, setComplaints] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filters, setFilters] = useState({
    q: "",
    status: "",
    priorityLevel: "",
    sortBy: "priorityScore",
    sortDirection: "desc",
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
          sortDirection: filters.sortDirection,
        };

        if (filters.status) params.status = filters.status;
        if (filters.priorityLevel) params.priorityLevel = filters.priorityLevel;
        if (debouncedQuery) params.q = debouncedQuery;

        const { data } = await api.get("/admin/complaints", { params });
        setComplaints(data.data.items);
        setMeta({
          page: data.data.page,
          totalPages: data.data.totalPages,
          total: data.data.total,
        });
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load complaints");
      } finally {
        setLoading(false);
      }
    },
    [
      api,
      debouncedQuery,
      filters.priorityLevel,
      filters.sortBy,
      filters.sortDirection,
      filters.status,
      meta.page,
    ],
  );

  useEffect(() => {
    fetchComplaints(1);
  }, [fetchComplaints]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({
      q: "",
      status: "",
      priorityLevel: "",
      sortBy: "priorityScore",
      sortDirection: "desc",
    });
  };

  useEffect(() => {
    const handle = setTimeout(() => {
      fetchComplaints(1);
    }, 0);

    return () => clearTimeout(handle);
  }, [
    filters.priorityLevel,
    filters.sortBy,
    filters.sortDirection,
    filters.status,
    debouncedQuery,
    fetchComplaints,
  ]);

  const updateStatus = async (complaintId, status) => {
    try {
      setLoading(true);
      await api.patch(`/admin/complaints/${complaintId}`, { status });
      await fetchComplaints(meta.page);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  const cards = useMemo(
    () =>
      complaints.map((complaint) => {
        const actions = [];

        if (complaint.status === "submitted") {
          actions.push({
            key: "start",
            element: (
              <Button
                variant="contained"
                size="small"
                onClick={() => updateStatus(complaint._id, "in_progress")}
              >
                Mark in progress
              </Button>
            ),
          });
        }

        if (complaint.status !== "resolved") {
          actions.push({
            key: "resolve",
            element: (
              <Button
                variant="outlined"
                size="small"
                color="success"
                onClick={() => updateStatus(complaint._id, "resolved")}
              >
                Mark resolved
              </Button>
            ),
          });
        }

        return (
          <ComplaintCard
            key={complaint._id}
            complaint={complaint}
            actions={actions}
          />
        );
      }),
    [complaints],
  );

  return (
    <Stack spacing={{ xs: 2, sm: 3 }} className="animate-fade-in">
      <Paper
        elevation={0}
        className="animate-fade-in-up"
        sx={{
          p: { xs: 2, sm: 3 },
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Stack spacing={3}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", sm: "flex-start" }}
            gap={2}
          >
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }} component="h1">
                City-wide complaints
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Filter by status, priority, and sort. Results are AI-ranked when
                searching.
              </Typography>
            </Box>
            <Button
              variant="outlined"
              size="medium"
              onClick={resetFilters}
              sx={{ flexShrink: 0 }}
            >
              Reset filters
            </Button>
          </Stack>

          <Grid container spacing={2.5}>
            <Grid xs={12}>
              <TextField
                label="Search"
                name="q"
                value={filters.q}
                onChange={handleFilterChange}
                placeholder="Search by title, description, or location"
                fullWidth
                size="small"
              />
            </Grid>
            <Grid xs={12} sm={6} md={3}>
              <TextField
                select
                label="Status"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                fullWidth
                size="small"
                SelectProps={{ MenuProps: { disableScrollLock: true } }}
              >
                {statusOptions.map((option) => (
                  <MenuItem key={option.value || "all"} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid xs={12} sm={6} md={3}>
              <TextField
                select
                label="Priority"
                name="priorityLevel"
                value={filters.priorityLevel}
                onChange={handleFilterChange}
                fullWidth
                size="small"
                SelectProps={{ MenuProps: { disableScrollLock: true } }}
              >
                {priorityOptions.map((option) => (
                  <MenuItem key={option.value || "all"} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid xs={12} sm={6} md={3}>
              <TextField
                select
                label="Sort by"
                name="sortBy"
                value={filters.sortBy}
                onChange={handleFilterChange}
                fullWidth
                size="small"
                SelectProps={{ MenuProps: { disableScrollLock: true } }}
              >
                <MenuItem value="priorityScore">Priority score</MenuItem>
                <MenuItem value="createdAt">Newest first</MenuItem>
              </TextField>
            </Grid>
            <Grid xs={12} sm={6} md={3}>
              <TextField
                select
                label="Order"
                name="sortDirection"
                value={filters.sortDirection}
                onChange={handleFilterChange}
                fullWidth
                size="small"
                SelectProps={{ MenuProps: { disableScrollLock: true } }}
              >
                <MenuItem value="desc">Descending</MenuItem>
                <MenuItem value="asc">Ascending</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
        {loading ? (
          <Stack
            alignItems="center"
            justifyContent="center"
            sx={{ minHeight: "40vh", py: 4 }}
          >
            <CircularProgress size={40} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Loading…
            </Typography>
          </Stack>
        ) : error ? (
          <Stack spacing={2} alignItems="center" sx={{ py: 4 }}>
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {error}
            </Alert>
            <Button
              variant="contained"
              onClick={() => fetchComplaints(meta.page)}
            >
              Retry
            </Button>
          </Stack>
        ) : complaints.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            No complaints match the current filters.
          </Alert>
        ) : (
          <Stack spacing={2}>
            <Stack spacing={2}>{cards}</Stack>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "stretch", sm: "center" }}
              gap={2}
              sx={{ pt: 2, mt: 2, borderTop: 1, borderColor: "divider" }}
            >
              <Typography variant="body2" color="text.secondary">
                Page {meta.page} of {meta.totalPages} · {meta.total} total
              </Typography>
              <Stack
                direction="row"
                spacing={2}
                justifyContent={{ xs: "stretch", sm: "flex-end" }}
              >
                <Button
                  variant="outlined"
                  size="small"
                  disabled={meta.page <= 1 || loading}
                  onClick={() => fetchComplaints(meta.page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="contained"
                  size="small"
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
