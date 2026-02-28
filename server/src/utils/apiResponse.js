export const successResponse = (res, statusCode, data, message = "Success") => {
  return res.status(statusCode).json({
    status: "success",
    message,
    data,
  });
};

export const errorResponse = (res, statusCode, message = "Error", errors = null) => {
  const response = {
    status: "error",
    message,
  };
  
  if (errors) {
    response.errors = errors;
  }
  
  return res.status(statusCode).json(response);
};
