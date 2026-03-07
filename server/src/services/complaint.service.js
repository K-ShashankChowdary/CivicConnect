// Build MongoDB filter from admin list query params
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

  if (query.resolved === "true") {
    filters.resolvedAt = { $ne: null };
  } else if (query.resolved === "false") {
    filters.resolvedAt = null;
  }

  return filters;
};

// Build MongoDB text search from query.q (single or multi-term)
export const buildSearchQuery = (query) => {
  const raw = query?.q?.trim();
  if (!raw) {
    return null;
  }

  // Split on whitespace to support multi-word queries like "pothole road".
  const terms = raw.split(/\s+/).filter(Boolean);

  // Single term: keep behavior equivalent to previous implementation.
  if (terms.length === 1) {
    const term = terms[0];
    return {
      $or: [
        { title: { $regex: term, $options: "i" } },
        { description: { $regex: term, $options: "i" } },
        { location: { $regex: term, $options: "i" } },
      ],
    };
  }

  // Multi-term: require that *each* term appears in at least one of the fields.
  // This builds an $and of per-term $or conditions across title/description/location.
  return {
    $and: terms.map((term) => ({
      $or: [
        { title: { $regex: term, $options: "i" } },
        { description: { $regex: term, $options: "i" } },
        { location: { $regex: term, $options: "i" } },
      ],
    })),
  };
};


