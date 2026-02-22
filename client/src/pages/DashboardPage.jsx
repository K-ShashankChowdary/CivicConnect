import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid2";

import ComplaintCard from "../components/ComplaintCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
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

const DashboardPage = () => {
  const { api } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    q: "",
    status: "",
    priorityLevel: "",
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

      const { data } = await api.get("/complaints", { params });
      setComplaints(data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load complaints");
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
    setFilters({ q: "", status: "", priorityLevel: "" });
  };

  if (loading && complaints.length === 0) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ minHeight: "50vh", py: 4 }}>
        <CircularProgress size={40} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Loading…</Typography>
      </Stack>
    );
  }

  if (error) {
    return (
      <Stack spacing={2} alignItems="center" sx={{ minHeight: "50vh", py: 4 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
        <Button variant="contained" onClick={fetchComplaints}>Retry</Button>
      </Stack>
    );
  }

  const hasActiveFilters = filters.q || filters.status || filters.priorityLevel;

  return (
    <Stack spacing={{ xs: 3, md: 4 }} className="animate-fade-in">
      {/* Hero */}
      <Box
        className="animate-slide-down"
        sx={{
          background: "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)",
          borderRadius: 2,
          p: { xs: 3, sm: 4 },
          color: "white",
          boxShadow: "0 4px 24px rgba(13, 148, 136, 0.25)",
          transition: "box-shadow 0.3s ease",
          "&:hover": { boxShadow: "0 8px 32px rgba(13, 148, 136, 0.3)" },
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
          gap={2}
        >
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }} component="h1">
              My Complaints
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Track and manage your submitted complaints
            </Typography>
          </Box>
          <Button
            variant="contained"
            href="/submit"
            size="large"
            fullWidth={false}
            sx={{
              alignSelf: { xs: "stretch", sm: "flex-end" },
              bgcolor: "white",
              color: "primary.main",
              fontWeight: 600,
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              "&:hover": { bgcolor: "grey.100", transform: "translateY(-1px)", boxShadow: 2 },
            }}
          >
            + New Complaint
          </Button>
        </Stack>
      </Box>

      {/* Filters – redesigned with more space and clear hierarchy */}
      <Paper
        className="animate-fade-in-up"
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 3.5 },
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          "& .MuiOutlinedInput-root": {
            transition: "border-color 0.2s ease, box-shadow 0.2s ease",
            "&:hover": { "& .MuiOutlinedInput-notchedOutline": { borderColor: "primary.light" } },
            "&.Mui-focused": { "& .MuiOutlinedInput-notchedOutline": { borderWidth: 2 } },
          },
        }}
      >
        <Stack spacing={3}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            flexWrap="wrap"
            gap={2}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "text.primary" }}>
              Filter & search
            </Typography>
            {hasActiveFilters && (
              <Button
                variant="outlined"
                size="small"
                onClick={resetFilters}
                sx={{
                  fontWeight: 600,
                  transition: "transform 0.2s ease",
                  "&:hover": { transform: "scale(1.02)" },
                }}
              >
                Reset filters
              </Button>
            )}
          </Stack>

          {/* Row 1: Search full width with generous spacing */}
          <TextField
            label="Search"
            name="q"
            value={filters.q}
            onChange={handleFilterChange}
            placeholder="Search by title, description, or location"
            fullWidth
            size="small"
            helperText={debouncedQuery ? "Results ranked by relevance" : null}
            sx={{
              "& .MuiInputBase-root": { borderRadius: 2 },
            }}
          />

          {/* Row 2: Status and Priority with clear spacing */}
          <Grid container spacing={3}>
            <Grid xs={12} sm={6} md={5}>
              <TextField
                select
                label="Status"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                fullWidth
                size="small"
                SelectProps={{ MenuProps: { disableScrollLock: true } }}
                sx={{ "& .MuiInputBase-root": { borderRadius: 2 } }}
              >
                {statusOptions.map((option) => (
                  <MenuItem key={option.value || "all"} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid xs={12} sm={6} md={5}>
              <TextField
                select
                label="Priority"
                name="priorityLevel"
                value={filters.priorityLevel}
                onChange={handleFilterChange}
                fullWidth
                size="small"
                SelectProps={{ MenuProps: { disableScrollLock: true } }}
                sx={{ "& .MuiInputBase-root": { borderRadius: 2 } }}
              >
                {priorityOptions.map((option) => (
                  <MenuItem key={option.value || "all"} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </Stack>
      </Paper>

      {loading ? (
        <Stack alignItems="center" py={5} className="animate-fade-in">
          <CircularProgress size={40} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Updating list…</Typography>
        </Stack>
      ) : complaints.length === 0 ? (
        <Alert
          severity="info"
          className="animate-fade-in-up"
          sx={{ borderRadius: 2 }}
        >
          {hasActiveFilters
            ? "No complaints match your filters. Try changing or resetting them."
            : "You haven't submitted any complaints yet."}
        </Alert>
      ) : (
        <Stack spacing={2} className="stagger-children">
          {complaints.map((complaint) => (
            <div key={complaint._id} className="stagger-child">
              <ComplaintCard
                complaint={complaint}
                actions={[
                  {
                    key: "details",
                    element: (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => navigate(`/complaints/${complaint._id}`)}
                        sx={{
                          transition: "transform 0.2s ease, box-shadow 0.2s ease",
                          "&:hover": { transform: "translateY(-1px)" },
                        }}
                      >
                        View details
                      </Button>
                    ),
                  },
                ]}
              />
            </div>
          ))}
        </Stack>
      )}
    </Stack>
  );
};

export default DashboardPage;
