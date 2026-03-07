// Global error handler; use ApiError in controllers for correct status/message
export const errorHandler = (err, req, res, next) => {
  const status = err.statusCode || 500;
  let message = err.message || "Something went wrong";

  if (status === 500 && process.env.NODE_ENV === "production") {
    message = "Internal Server Error";
  }

  const body = {
    success: false,
    message,
    ...(err.errors != null && err.errors.length > 0 && { errors: err.errors }),
    ...(process.env.NODE_ENV === "development" && err.stack && { stack: err.stack }),
  };

  return res.status(status).json(body);
};

export default errorHandler;
