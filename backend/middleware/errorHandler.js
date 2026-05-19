// =====================================================
// middleware/errorHandler.js — Global Error Handler
// =====================================================

const errorHandler = (err, req, res, next) => {
  console.error('🔴 Error:', err.message);

  // MySQL duplicate entry
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'Data sudah ada (duplikat).',
    });
  }

  // MySQL foreign key constraint
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({
      success: false,
      message: 'Referensi data tidak ditemukan.',
    });
  }

  // Multer upload error
  if (err.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      message: err.code === 'LIMIT_FILE_SIZE'
        ? 'Ukuran foto maksimal 2MB.'
        : 'Gagal mengupload file.',
    });
  }

  if (err.message === 'Format foto harus JPG, PNG, atau WEBP.') {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  // Validation error
  if (err.status === 400) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  // Default server error
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'development'
      ? err.message
      : 'Terjadi kesalahan pada server.',
  });
};

module.exports = errorHandler;
