const multer = require('multer');
const sharp = require('sharp');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');

// ... (Configuração do r2Client permanece igual) ...
const r2Client = new S3Client({ /* ...suas configs... */ });

const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } 
});

const uploadToR2 = async (buffer, filename, folder) => {
    const key = `${folder}/${filename}`;
    await r2Client.send(new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: 'image/webp',
    }));
    return key; // Retorna o caminho (ex: produtos/foto.webp)
};

const optimizeAndUploadImages = async (req, res, next) => {
    // Se não houver arquivos, segue o fluxo
    if (!req.files || req.files.length === 0) return next();

    try {
        const processedImages = [];

        // Loop por cada imagem enviada
        const uploadPromises = req.files.map(async (file, index) => {
            const fileId = uuidv4();
            const filename = `${fileId}.webp`;

            // 1. Processamento Paralelo (Thumb + Full)
            const [thumbBuffer, fullBuffer] = await Promise.all([
                sharp(file.buffer).resize(400, 400, { fit: 'cover' }).webp({ quality: 80 }).toBuffer(),
                sharp(file.buffer).resize(1920, 1920, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toBuffer()
            ]);

            // 2. Upload Paralelo
            const [thumbKey, fullKey] = await Promise.all([
                uploadToR2(thumbBuffer, `thumb_${filename}`, 'produtos'),
                uploadToR2(fullBuffer, `full_${filename}`, 'produtos')
            ]);

            // 3. Monta o objeto para o controller
            return {
                id: uuidv4(), // Já geramos o ID do banco aqui ou no controller
                url_thumb: thumbKey,
                url_full: fullKey,
                is_main: index === 0 // Define a primeira foto enviada como capa automaticamente?
            };
        });

        // Aguarda todos os uploads terminarem
        req.processedImages = await Promise.all(uploadPromises);
        
        next();

    } catch (error) {
        console.error('Erro no processamento de imagens:', error);
        return res.status(500).json({ error: 'Falha ao processar imagens.' });
    }
};

module.exports = {
    // Agora usamos upload.array. 'photos' é o nome do campo no Frontend, max 10 fotos.
    uploadArray: upload.array('photos', 10), 
    optimizeAndUploadImages
};