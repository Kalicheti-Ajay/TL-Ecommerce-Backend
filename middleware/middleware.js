const jwt = require("jsonwebtoken");

function readToken(req) {
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7) : null;
}

function authenticate(req, res, next) {
  const token = readToken(req);
  if (!token)
    {
        return res.status(401).json({ message: "Authentication token is required." });
    }

  try { 
      req.user = jwt.verify(token, process.env.JWT_SECRET); return next(); 
  }
  catch { 
      return res.status(401).json({ message: "Invalid or expired token." });
  }
}

function optionalAuthenticate(req, res, next) {
  const token = readToken(req);
  if (token) { 
    try { 
      req.user = jwt.verify(token, process.env.JWT_SECRET); 
    } 
    catch { 
      // If the token is invalid
    }
  }
  return next();
}





function authorize(...roles) 
{
  return (req, res, next) => !req.user || !roles.includes(req.user.role)
    ? res.status(403).json({ message: "Access denied. Admin access required." })
    : next();
}

module.exports = { authenticate, optionalAuthenticate, authorize };

