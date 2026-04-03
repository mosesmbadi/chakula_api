const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { S3Client } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const config = require('../config');
const { AppError } = require('./errorHandler');

const ALLOWED_MIME = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

const EXT_MAP = {
  'image/jpeg': '.jpg',
  'image/jpg':  '.jpg',
  'image/png':  '.png',
  'image/webp': '.webp',
};

const s3Client = new S3Client({
  region: config.s3.region,
  credentials: {
    accessKeyId: config.s3.accessKeyId,
    secretAccessKey: config.s3.secretAccessKey,
  },
});

function fileFilter(_req, file, cb) {
  if (ALLOWED_MIME.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Only JPEG, PNG, and WebP images are allowed', 400));
  }
}

// Use memory storage — we stream the buffer straight to S3.
const upload = multer({ storage: multer.memoryStorage(), fileFilter, limits: { fileSize: MAX_SIZE } });

/**
 * Express middleware that accepts an optional image uploaded under the field
 * name defined by IMAGE_FIELD ('image'). Clients MUST use this exact field name.
 * On success it sets req.fileUrl to the public HTTPS URL of the uploaded object.
 */
const IMAGE_FIELD = 'image';

function uploadMealImage() {
  const multerSingle = upload.single(IMAGE_FIELD);

  return async function (req, res, next) {
    multerSingle(req, res, async (err) => {
      if (err) {
        // Give a descriptive message so the client knows the expected field name
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return next(new AppError(`Image must be uploaded under the field name "${IMAGE_FIELD}"`, 400));
        }
        return next(err instanceof AppError ? err : new AppError(err.message, 400));
      }
      if (!req.file) return next(); // image is optional

      try {
        const ext = EXT_MAP[req.file.mimetype] || path.extname(req.file.originalname).toLowerCase();
        const key = `meal-images/${uuidv4()}${ext}`;

        const parallelUpload = new Upload({
          client: s3Client,
          params: {
            Bucket: config.s3.bucket,
            Key: key,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
          },
        });

        await parallelUpload.done();

        req.fileUrl = `https://${config.s3.bucket}.s3.${config.s3.region}.amazonaws.com/${key}`;
        next();
      } catch (uploadErr) {
        next(uploadErr);
      }
    });
  };
}

module.exports = { uploadMealImage };
