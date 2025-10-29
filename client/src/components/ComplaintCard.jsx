import PropTypes from 'prop-types';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import Box from '@mui/material/Box';

const statusColors = {
  submitted: 'info',
  in_progress: 'warning',
  resolved: 'success'
};

const ComplaintCard = ({ complaint, actions }) => {
  const createdDate = new Date(complaint.createdAt).toLocaleString();
  const resolvedDate = complaint.resolvedAt ? new Date(complaint.resolvedAt).toLocaleString() : null;

  return (
    <Card 
      elevation={0} 
      sx={{ 
        borderRadius: 3, 
        border: '1px solid', 
        borderColor: 'divider',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
          transform: 'translateY(-2px)',
          borderColor: 'primary.light',
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
          {/* Left side - Tags */}
          <Stack spacing={1.5} sx={{ minWidth: { xs: '100%', md: 160 } }}>
            <Chip 
              label={complaint.category} 
              color="primary" 
              size="medium"
              sx={{ fontWeight: 600 }}
            />
            <Chip
              label={complaint.priorityLevel}
              color={
                complaint.priorityLevel === 'Critical'
                  ? 'error'
                  : complaint.priorityLevel === 'High'
                    ? 'warning'
                    : complaint.priorityLevel === 'Medium'
                      ? 'info'
                      : 'default'
              }
              size="medium"
              sx={{ fontWeight: 600 }}
            />
            <Chip
              label={complaint.status.replace('_', ' ').toUpperCase()}
              color={statusColors[complaint.status] || 'default'}
              size="medium"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
          </Stack>

          {/* Right side - Content */}
          <Stack spacing={2} sx={{ flex: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
              {complaint.title}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Reported {createdDate}
            </Typography>

            <Divider sx={{ my: 1 }} />

            <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.7 }}>
              {complaint.description}
            </Typography>

            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
              {complaint.tags?.map((tag) => (
                <Tooltip key={tag.label} title={tag.label} arrow>
                  <Chip label={tag.value} size="small" color="default" />
                </Tooltip>
              ))}
              {complaint.location && (
                <Chip label={`Location: ${complaint.location}`} size="small" variant="outlined" />
              )}
              {complaint.incidentTime && (
                <Chip
                  label={`Incident: ${new Date(complaint.incidentTime).toLocaleString()}`}
                  size="small"
                  variant="outlined"
                />
              )}
            </Stack>
          </Stack>
        </Stack>
      </CardContent>

      {(resolvedDate || actions?.length) && (
        <CardActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
          <Box>
            {resolvedDate && (
              <Typography variant="caption" color="text.secondary">
                Resolved on {resolvedDate}
              </Typography>
            )}
          </Box>

          {actions && actions.length > 0 && (
            <Stack direction="row" spacing={1}>
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
        value: PropTypes.string.isRequired
      })
    ),
    createdAt: PropTypes.string.isRequired,
    incidentTime: PropTypes.string,
    resolvedAt: PropTypes.string
  }).isRequired,
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      element: PropTypes.node.isRequired
    })
  )
};

ComplaintCard.defaultProps = {
  actions: []
};

export default ComplaintCard;
