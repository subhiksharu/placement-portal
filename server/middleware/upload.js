const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(), // file is kept in RAM as a Buffer
  limits: { fileSize: 2 * 1024 * 1024, files: 1 }, // 2 MB, one file
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') return cb(null, true);
    cb(new Error('Only PDF files are allowed'));
  },
});

// Wraps multer so its errors become clean JSON responses
const handleResumeUpload = (req, res, next) => {
  upload.single('resume')(req, res, (err) => {
    if (!err) return next();

    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File is too large (maximum 2 MB)' });
    }
    res.status(400).json({ message: err.message });
  });
};

module.exports = { handleResumeUpload };