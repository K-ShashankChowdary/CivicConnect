export const buildAdminComplaintFilters = (query) => {
  const filters = {};

  if (query.status) {
    filters.status = query.status;
  }

  if (query.priorityLevel) {
    filters.priorityLevel = query.priorityLevel;
  }

  if (query.category) {
    filters.category = query.category;
  }

  if (query.impact) {
    filters.impact = query.impact;
  }

  if (query.createdBy) {
    filters.createdBy = query.createdBy;
  }

  if (query.assignedTo) {
    filters.assignedTo = query.assignedTo;
  }

  if (query.minScore || query.maxScore) {
    filters.priorityScore = {};
    if (query.minScore) {
      filters.priorityScore.$gte = Number(query.minScore);
    }
    if (query.maxScore) {
      filters.priorityScore.$lte = Number(query.maxScore);
    }
  }

  if (query.startDate || query.endDate) {
    filters.createdAt = {};
    if (query.startDate) {
      filters.createdAt.$gte = new Date(query.startDate);
    }
    if (query.endDate) {
      filters.createdAt.$lte = new Date(query.endDate);
    }
  }

  if (query.resolved === 'true') {
    filters.resolvedAt = { $ne: null };
  } else if (query.resolved === 'false') {
    filters.resolvedAt = null;
  }

  return filters;
};

export const buildSearchQuery = (query) => {
  if (!query?.q) {
    return null;
  }

  return {
    $or: [
      { title: { $regex: query.q, $options: 'i' } },
      { description: { $regex: query.q, $options: 'i' } },
      { location: { $regex: query.q, $options: 'i' } }
    ]
  };
};
