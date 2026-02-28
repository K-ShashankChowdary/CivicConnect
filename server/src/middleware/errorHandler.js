import { errorResponse } from '../utils/apiResponse.js';

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  const status = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.error('Error:', err);
  }

  return errorResponse(res, status, message, err.errors);
};

export default errorHandler;
