import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Grid from "@mui/material/Grid2";

import { useAuth } from "../context/AuthContext.jsx";

const statusColors = {
  submitted: "info",
  in_progress: "warning",
  resolved: "success",
};

const ComplaintDetailsPage = () => {
  const { api } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchComplaint = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await api.get(`/complaints/${id}`);
        setComplaint(data.data);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to load complaint details"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchComplaint();
  }, [api, id]);

  if (loading) {
    return (
      <Stack
        alignItems="center"
        justifyContent="center"
        sx={{ minHeight: "60vh" }}
      >
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading complaint details…</Typography>
      </Stack>
    );
  }

  if (error) {
    return (
      <Stack spacing={2} alignItems="center" sx={{ minHeight: "60vh" }}>
        <Alert severity="error">{error}</Alert>
        <Button variant="contained" onClick={() => navigate(-1)}>
          Go back
        </Button>
      </Stack>
    );
  }

  if (!complaint) {
    return null;
  }

  const createdDate = new Date(complaint.createdAt).toLocaleString();
  const incidentDate = complaint.incidentTime
    ? new Date(complaint.incidentTime).toLocaleString()
    : null;

  return (
    <Stack spacing={3}>
      <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
        <Stack spacing={2}>
          <Button
            variant="text"
            onClick={() => navigate(-1)}
            sx={{ alignSelf: "flex-start" }}
          >
            Back to complaints
          </Button>

          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {complaint.title}
          </Typography>

          <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1}>
            <Chip label={complaint.category} color="primary" />
            <Chip
              label={complaint.status.replace("_", " ").toUpperCase()}
              color={statusColors[complaint.status] || "default"}
              variant="outlined"
            />
            <Chip label={complaint.priorityLevel} />
            {complaint.location && (
              <Chip label={`Location: ${complaint.location}`} />
            )}
            {incidentDate && <Chip label={`Incident: ${incidentDate}`} />}
          </Stack>

          <Typography variant="body2" color="text.secondary">
            Reported on {createdDate}
          </Typography>

          <Typography variant="h6" sx={{ mt: 2 }}>
            Complaint details
          </Typography>
          <Typography
            variant="body1"
            sx={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}
          >
            {complaint.description}
          </Typography>
        </Stack>
      </Paper>

      {complaint.attachments && complaint.attachments.length > 0 && (
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Related images
          </Typography>
          <Grid container spacing={2}>
            {complaint.attachments.map((url) => (
              <Grid key={url} xs={12} sm={6} md={4}>
                <Box
                  component="img"
                  src={url}
                  alt={complaint.title}
                  loading="lazy"
                  sx={{
                    width: "100%",
                    borderRadius: 2,
                    objectFit: "cover",
                    maxHeight: 260,
                  }}
                />
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}
    </Stack>
  );
};

export default ComplaintDetailsPage;
