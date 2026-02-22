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
import CategoryChip from "../components/CategoryChip.jsx";

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
          err.response?.data?.message || "Failed to load complaint details",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchComplaint();
  }, [api, id]);

  if (loading) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ minHeight: "50vh", py: 4 }}>
        <CircularProgress size={40} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Loading…
        </Typography>
      </Stack>
    );
  }

  if (error) {
    return (
      <Stack spacing={2} alignItems="center" sx={{ minHeight: "50vh", py: 4 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
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
    <Stack spacing={{ xs: 2, sm: 3 }}>
      <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
        <Stack spacing={2}>
          <Button
            variant="text"
            onClick={() => navigate(-1)}
            size="small"
            sx={{ alignSelf: "flex-start", fontWeight: 600 }}
          >
            ← Back to complaints
          </Button>

          <Typography variant="h5" sx={{ fontWeight: 700 }} component="h1">
            {complaint.title}
          </Typography>

          <Stack direction="row" flexWrap="wrap" gap={1}>
            <CategoryChip category={complaint.category} className="text-sm" />
            <Chip
              label={complaint.status.replace("_", " ")}
              color={statusColors[complaint.status] || "default"}
              variant="outlined"
              size="small"
              sx={{ textTransform: "capitalize" }}
            />
            <Chip
              label={complaint.priorityLevel}
              size="small"
              color={
                complaint.priorityLevel === "Critical"
                  ? "error"
                  : complaint.priorityLevel === "High"
                    ? "warning"
                    : complaint.priorityLevel === "Medium"
                      ? "info"
                      : "default"
              }
            />
            {typeof complaint.priorityScore === "number" && (
              <Chip
                label={`Score: ${complaint.priorityScore.toFixed(2)}`}
                variant="outlined"
                size="small"
              />
            )}
            {complaint.location && (
              <Chip label={complaint.location} size="small" variant="outlined" />
            )}
            {incidentDate && (
              <Chip label={`Incident: ${incidentDate}`} size="small" variant="outlined" />
            )}
          </Stack>

          <Typography variant="caption" color="text.secondary" display="block">
            Reported {createdDate}
          </Typography>

          {(typeof complaint.priorityScore === "number" || complaint.priorityReason) && (
            <Typography variant="caption" color="text.secondary" display="block">
              {complaint.priorityReason
                ? `AI priority reason: ${complaint.priorityReason}`
                : "Priority assigned by AI from category, description, and urgency."}
            </Typography>
          )}

          <Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 1 }}>
            Description
          </Typography>
          <Typography
            variant="body1"
            sx={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}
          >
            {complaint.description}
          </Typography>
        </Stack>
      </Paper>

      {complaint.attachments?.length > 0 && (
        <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
            Attached images
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
                    maxHeight: 280,
                    border: "1px solid",
                    borderColor: "divider",
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
