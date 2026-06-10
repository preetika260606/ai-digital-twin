//This middleware will verify JWT tokens before protected routes run.
//contains authentication logic separately.

const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {//middleware function that will be used in protected routes
  try {

    const token = req.header("Authorization");

    if (!token) {
      return res.status(401).json({
        message: "Access denied"
      });
    }

    const verified = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = verified;

    next();

  } catch (error) {

    res.status(401).json({
      message: "Invalid token"
    });

  }
};

module.exports = auth;