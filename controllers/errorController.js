import AppError from "./../utils/appError.js"

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`
  return new AppError(message, 400)
}

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0]
  const message = `Duplicate field value: ${value}. Please use another value!`
  return new AppError(message, 400)
}

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message)
  const message = `Invalid input data. ${errors.join(". ")}`
  return new AppError(message, 400)
}

const handleInvalidToken = () => new AppError("Invalid token. Please log in again!", 401)

const handleUnauthorized = () => new AppError("Authentication Required. Please log in!", 401)

const handleInsufficientScope = () => new AppError("Permission denied!", 403)

const handleValidationErrorAuth0 = (err) => new AppError(err.message, 400)

const sendErrorDev = (err, req, res) => {
  return res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  })
}

const sendErrorProd = (err, req, res) => {
  // Operational error: send message to client
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    })
  }
  // Unknown error: don't send error details
  console.error("ERROR :", err)
  return res.status(500).json({
    status: "error",
    message: "Something went wrong!",
  })
}

export default (err, req, res, next) => {
  err.statusCode = err.statusCode || 500
  err.status = err.status || "error"

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, req, res)
  } else {
    let error = { ...err }
    error.message = err.message

    // Mongo
    if (error.name === "CastError") error = handleCastErrorDB(error)
    if (error.code === 11000) error = handleDuplicateFieldsDB(error)
    if (error.name === "ValidationError") error = handleValidationErrorDB(error) // TODO
    // Auth0
    if (error.name === "InvalidTokenError") error = handleInvalidToken(error)
    if (error.name === "UnauthorizedError") error = handleUnauthorized(error)
    if (error.name === "InsufficientScopeError") error = handleInsufficientScope(error)
    if (error.name === "Bad Request") error = handleValidationErrorAuth0(error)

    sendErrorProd(error, req, res)
  }
}
