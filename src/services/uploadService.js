const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');

// 1. R2 Client Configuration
const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.AWS_ENDPOINT,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Uploads a file to Cloudflare R2
 * @param {Object} file - File object from Multer (req.file)
 * @param {String} folder - Virtual folder for organization (e.g., 'products', 'avatars')
 * @returns {String} - Public image URL
 */
const uploadImage = async (file, folder = 'uploads') => {
  // 2. Generate unique name to avoid overwriting (hash + timestamp + extension)
  const fileExtension = file.originalname.split('.').pop();
  const randomName = crypto.randomBytes(16).toString('hex');
  const fileName = `${folder}/${Date.now()}-${randomName}.${fileExtension}`;

  // 3. Prepare the upload command
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET,
    Key: fileName,
    Body: file.buffer, // The actual file (in memory)
    ContentType: file.mimetype,
  });

  try {
    // 4. Send to the cloud
    await s3Client.send(command);

    // 5. Construct public URL
    // Remove trailing slash from env if exists to avoid double //
    const publicUrlBase = process.env.AWS_URL.replace(/\/$/, '');
    return `${publicUrlBase}/${fileName}`;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error in upload Service:', error);
    throw new Error('Failed to communicate with storage server.');
  }
};

module.exports = {
  uploadImage,
};