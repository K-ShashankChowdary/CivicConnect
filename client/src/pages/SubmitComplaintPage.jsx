import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import MyLocationIcon from "@mui/icons-material/MyLocation";

import { useAuth } from "../context/AuthContext.jsx";

const categories = [
  "Water Supply",
  "Sanitation",
  "Waste Management",
  "Roads & Transport",
  "Electricity",
  "Street Lighting",
  "Public Safety",
  "Noise Pollution",
  "Air Quality",
  "Drainage",
  "Animal Control",
  "Public Transport",
  "Traffic",
  "Building Maintenance",
  "Parks & Recreation",
];

const SubmitComplaintPage = () => {
  const { api } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    category: "",
    description: "",
    location: "",
    latitude: "",
    longitude: "",
  });

  const [files, setFiles] = useState([]);

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    setFiles(selectedFiles);
  };

  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Reverse geocode to get street address
        let address = null;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            { headers: { "Accept-Language": "en" } },
          );
          if (res.ok) {
            const data = await res.json();
            address = data.display_name || null;
          }
        } catch {
          // Fallback to coordinate string if geocoding fails
        }

        const fallback = `Lat ${latitude.toFixed(5)}, Lng ${longitude.toFixed(5)}`;

        setForm((prev) => ({
          ...prev,
          latitude: latitude.toString(),
          longitude: longitude.toString(),
          location: address || prev.location || fallback,
        }));
        setLocating(false);
      },
      () => {
        setError("Failed to get current location.");
        setLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, value);
      });

      files.forEach((file) => {
        formData.append("images", file);
      });

      await api.post("/complaints", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccess(true);
      setTimeout(() => {
        navigate("/dashboard");
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit complaint");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 720, mx: "auto" }} className="animate-fade-in">
      <Box
        className="animate-slide-down"
        sx={{
          background: "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)",
          borderRadius: 2,
          p: { xs: 3, sm: 4 },
          mb: { xs: 3, sm: 4 },
          color: "white",
          boxShadow: "0 4px 24px rgba(13, 148, 136, 0.2)",
          transition: "box-shadow 0.3s ease",
          "&:hover": { boxShadow: "0 8px 32px rgba(13, 148, 136, 0.25)" },
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }} component="h1">
          Submit a complaint
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.95 }}>
          Our AI assigns a priority from your description and category so urgent
          issues get faster attention.
        </Typography>
      </Box>

      <Paper
        elevation={0}
        className="animate-fade-in-up"
        sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2 }}
      >
        <Stack component="form" spacing={3} onSubmit={handleSubmit}>
          {error && (
            <Alert
              severity="error"
              onClose={() => setError(null)}
              sx={{ borderRadius: 2 }}
            >
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ borderRadius: 2 }}>
              Complaint submitted. Redirecting…
            </Alert>
          )}

          <TextField
            label="Title"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            fullWidth
            size="small"
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
            size="small"
            SelectProps={{ MenuProps: { disableScrollLock: true } }}
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
            size="small"
            placeholder="Street address or landmark"
            helperText={
              "Use current location to auto-fill a nearby street address, or enter it manually."
            }
          />

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            alignItems={{ xs: "stretch", sm: "center" }}
          >
            <Button
              variant="outlined"
              size="small"
              onClick={handleUseCurrentLocation}
              disabled={locating}
              startIcon={
                locating ? (
                  <CircularProgress size={16} sx={{ color: "#f97316" }} />
                ) : (
                  <MyLocationIcon />
                )
              }
              sx={{
                minWidth: { sm: 220 },
                borderColor: "rgba(249, 115, 22, 0.55)",
                color: "#c2410c",
                "&:hover": {
                  borderColor: "rgba(249, 115, 22, 0.9)",
                  backgroundColor: "rgba(249, 115, 22, 0.06)",
                },
              }}
            >
              {locating ? "Detecting location" : "Use current location"}
            </Button>

            {form.latitude && form.longitude && (
              <Chip
                variant="outlined"
                size="small"
                label={`${Number(form.latitude).toFixed(5)}, ${Number(form.longitude).toFixed(5)}`}
                sx={{
                  alignSelf: { xs: "flex-start", sm: "center" },
                  borderColor: "rgba(148, 163, 184, 0.7)",
                  color: "text.secondary",
                }}
              />
            )}
          </Stack>

          <TextField
            label="Detailed description"
            name="description"
            value={form.description}
            onChange={handleChange}
            required
            fullWidth
            multiline
            minRows={4}
            size="small"
            placeholder="Include location, severity, and any immediate concerns."
          />

          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            flexWrap="wrap"
            gap={1}
          >
            <Button variant="outlined" component="label" size="medium">
              Upload images
              <input
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={handleFileChange}
              />
            </Button>
            {files.length > 0 && (
              <Typography variant="body2" color="text.secondary">
                {files.length} image{files.length > 1 ? "s" : ""} selected
              </Typography>
            )}
          </Stack>

          <Stack
            direction={{ xs: "column-reverse", sm: "row" }}
            spacing={2}
            justifyContent="flex-end"
            sx={{ pt: 1 }}
          >
            <Button
              variant="outlined"
              onClick={() => navigate(-1)}
              fullWidth={false}
              sx={{ alignSelf: { xs: "stretch", sm: "flex-end" } }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ alignSelf: { xs: "stretch", sm: "flex-end" } }}
            >
              {loading ? "Submitting…" : "Submit complaint"}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
};

export default SubmitComplaintPage;
