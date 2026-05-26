const jwt = require('jsonwebtoken');

exports.authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: "Not authorized" });
    
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ message: "Invalid token" });
    }
};

exports.roleMiddleware = (roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: "Forbidden" });
    next();
};