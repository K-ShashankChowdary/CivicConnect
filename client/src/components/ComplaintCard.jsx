import PropTypes from "prop-types";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Box from "@mui/material/Box";

import CategoryChip from "./CategoryChip.jsx";

const statusColors = {
  submitted: "info",
  in_progress: "warning",
  resolved: "success",
};

const ComplaintCard = ({ complaint, actions }) => {
  const createdDate = new Date(complaint.createdAt).toLocaleString();
  const resolvedDate = complaint.resolvedAt
    ? new Date(complaint.resolvedAt).toLocaleString()
    : null;

  const descriptionPreview =
    complaint.description && complaint.description.length > 220
      ? `${complaint.description.slice(0, 220)}…`
      : complaint.description;

  const priorityColor =
    complaint.priorityLevel === "Critical"
      ? "error"
      : complaint.priorityLevel === "High"
        ? "warning"
        : complaint.priorityLevel === "Medium"
          ? "info"
          : "default";

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        borderLeft: { xs: "none", sm: "4px solid" },
        ...(priorityColor !== "default" && {
          borderLeftColor: {
            sm: (theme) =>
              theme.palette[priorityColor]?.main || theme.palette.divider,
          },
        }),
        transition:
          "box-shadow 0.25s ease, border-color 0.25s ease, transform 0.25s ease",
        overflow: "hidden",
        "&:hover": {
          boxShadow: "0 12px 28px -4px rgba(0,0,0,0.12)",
          borderColor: "primary.light",
          transform: "translateY(-2px)",
        },
      }}
    >
      <CardContent
        sx={{ p: { xs: 2, sm: 3 }, "&:last-child": { pb: { xs: 2, sm: 3 } } }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={{ xs: 2, md: 3 }}
        >
          <Stack
            direction="row"
            flexWrap="wrap"
            gap={1}
            sx={{ minWidth: { md: 140 }, rowGap: 1 }}
          >
            <CategoryChip category={complaint.category} />
            <Tooltip title="AI-assigned priority" arrow>
              <Chip
                label={complaint.priorityLevel}
                color={priorityColor}
                size="small"
                sx={{ fontWeight: 600 }}
              />
            </Tooltip>
            <Chip
              label={complaint.status.replace("_", " ")}
              color={statusColors[complaint.status] || "default"}
              size="small"
              variant="outlined"
              sx={{ fontWeight: 600, textTransform: "capitalize" }}
            />
          </Stack>

          <Stack spacing={1.5} sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 700, lineHeight: 1.3 }}
            >
              {complaint.title}
            </Typography>

            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
            >
              {createdDate}
            </Typography>

            <Typography
              variant="body2"
              sx={{ lineHeight: 1.6 }}
              color="text.secondary"
            >
              {descriptionPreview}
            </Typography>

            <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mt: 0.5 }}>
              {complaint.tags
                ?.filter(
                  (tag) => tag.label !== "Impact" && tag.label !== "address",
                )
                .map((tag) => (
                  <Tooltip key={tag.label} title={tag.label} arrow>
                    <Chip
                      label={tag.value}
                      size="small"
                      color="default"
                      sx={{ maxWidth: 240 }}
                    />
                  </Tooltip>
                ))}
              {complaint.location && (
                <Tooltip title="Location" arrow>
                  <Chip
                    label={complaint.location}
                    size="small"
                    variant="outlined"
                    sx={{ maxWidth: 420 }}
                  />
                </Tooltip>
              )}
              {complaint.incidentTime && (
                <Chip
                  label={`Incident: ${new Date(
                    complaint.incidentTime,
                  ).toLocaleString()}`}
                  size="small"
                  variant="outlined"
                />
              )}
              {complaint.attachments && complaint.attachments.length > 0 && (
                <Chip
                  label={`${complaint.attachments.length} image${
                    complaint.attachments.length > 1 ? "s" : ""
                  }`}
                  size="small"
                  variant="outlined"
                />
              )}
            </Stack>
          </Stack>
        </Stack>
      </CardContent>

      {(resolvedDate || actions?.length) && (
        <CardActions
          sx={{
            justifyContent: "space-between",
            px: { xs: 2, sm: 3 },
            pb: 2,
            pt: 0,
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          <Box sx={{ order: { xs: 2, sm: 1 } }}>
            {resolvedDate && (
              <Typography variant="caption" color="text.secondary">
                Resolved {resolvedDate}
              </Typography>
            )}
          </Box>
          {actions?.length > 0 && (
            <Stack direction="row" spacing={1} sx={{ order: { xs: 1, sm: 2 } }}>
              {actions.map((action) => (
                <Box key={action.key}>{action.element}</Box>
              ))}
            </Stack>
          )}
        </CardActions>
      )}
    </Card>
  );
};

ComplaintCard.propTypes = {
  complaint: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    location: PropTypes.string,
    category: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    priorityLevel: PropTypes.string.isRequired,
    tags: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string.isRequired,
        value: PropTypes.string.isRequired,
      }),
    ),
    attachments: PropTypes.arrayOf(PropTypes.string),
    createdAt: PropTypes.string.isRequired,
    incidentTime: PropTypes.string,
    resolvedAt: PropTypes.string,
    latitude: PropTypes.number,
    longitude: PropTypes.number,
  }).isRequired,
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      element: PropTypes.node.isRequired,
    }),
  ),
};

ComplaintCard.defaultProps = {
  actions: [],
};

export default ComplaintCard;
