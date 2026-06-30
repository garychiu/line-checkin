function adminAuth(req, res, next) {
  const expectedKey = process.env.ADMIN_API_KEY;

  if (!expectedKey) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const providedKey =
    req.headers["x-admin-key"] || req.query.key;

  if (!providedKey || providedKey !== expectedKey) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
}

module.exports = adminAuth;
