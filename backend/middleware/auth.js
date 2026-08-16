const jwt = require("jsonwebtoken");

const JWT_SECRETKEY =
  process.env.JWT_SECRETKEY || "deepanshu";

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Authorization header is missing",
      });
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization format",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token is missing",
      });
    }

    const decoded = jwt.verify(
      token,
      JWT_SECRETKEY
    );

    console.log("========== AUTH ==========");
    console.log("DECODED TOKEN:", decoded);

    req.user = {
      ...decoded,
      _id: decoded._id || decoded.id,
    };

    console.log("REQ.USER:", req.user);

    next();

  } catch (error) {
    console.error(
      "AUTH ERROR:",
      error.message
    );

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

module.exports = authMiddleware;