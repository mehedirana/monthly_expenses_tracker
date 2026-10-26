function requireAuth(req, res, next) {
  if (!req.session?.userId) {
    return res.status(401).json({
      message: "Authentication required",
    });
  }

  next();
}

function requireAdmin(req, res, next) {
  if (!req.session?.userId) {
    return res.status(401).json({
      message: "Authentication required",
    });
  }

  if (req.session.role !== "admin") {
    return res.status(403).json({
      message: "Admin access required",
    });
  }

  next();
}

module.exports = {
  requireAuth,
  requireAdmin,
};