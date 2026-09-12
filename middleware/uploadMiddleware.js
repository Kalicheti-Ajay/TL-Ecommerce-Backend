const multer = require("multer");
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const isCsv = file.mimetype === "text/csv" || file.originalname.toLowerCase().endsWith(".csv");
  if (!isCsv) 
  {
    return cb(new Error("Only CSV files are allowed."));
  }
  cb(null, true);
};
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

module.exports = upload;