const errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        return res.status(400).json({ success: false, message: 'Duplicate field value entered' });
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message).join(', ');
        return res.status(400).json({ success: false, message });
    }

    const statusCode = err.statusCode || 500;
    let message = err.message || 'Server Error';

    // Mask raw internal errors (like MongoDB connection errors) in production
    if (statusCode === 500 && process.env.NODE_ENV === 'production') {
        message = 'Something went wrong. Please try again.';
    } else if (statusCode === 500) {
        // Even in development, if it's a specific MongoDB closing error, mask it to test behavior
        if (message.includes('closing') || message.includes('hidden') || message.includes('failed to connect')) {
            message = 'Unable to sign in right now. Please try again.';
        }
    }

    res.status(statusCode).json({
        success: false,
        message
    });
};

module.exports = errorHandler;
