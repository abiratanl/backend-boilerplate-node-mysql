const multer = require('multer');
const sharp = require('sharp');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');

// 1. Configuração do Cliente R2 (Usando suas variáveis do .env)
const r2Client = new S3Client({
    region: 'auto',
    endpoint: process.env.AWS_ENDPOINT,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

// 2. Configuração do Multer (Armazena na memória RAM temporariamente)
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // Limite de 10MB
});

// Função auxiliar para enviar buffer para o R2
const uploadToR2 = async (buffer, filename, folder) => {
    const key = `${folder}/${filename}`;
    
    await r2Client.send(new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET, // Nome do Bucket no seu .env
        Key: key,
        Body: buffer,
        ContentType: 'image/webp',
    }));

    // Retorna a URL completa (Usando AWS_URL do seu .env)
    // Removemos a barra final se houver para evitar duplicidade
    const baseUrl = process.env.AWS_URL.replace(/\/$/, '');
    return `${baseUrl}/${key}`;
};

const optimizeAndUploadImages = async (req, res, next) => {
    // Se não vier arquivos, passa direto para o controller (para cadastros sem foto)
    if (!req.files || req.files.length === 0) return next();

    try {
        console.log('Iniciando processamento de imagens...');

        // Loop por cada imagem enviada
        const uploadPromises = req.files.map(async (file, index) => {
            const fileId = uuidv4();
            const filename = `${fileId}.webp`;

            // A. Processamento com Sharp (Gera Thumbnail pequena e Imagem Grande otimizada)
            const [thumbBuffer, fullBuffer] = await Promise.all([
                // Thumb: 400x400
                sharp(file.buffer).resize(400, 400, { fit: 'cover' }).webp({ quality: 80 }).toBuffer(),
                // Full: Max 1920px
                sharp(file.buffer).resize(1920, 1920, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toBuffer()
            ]);

            // B. Envia para o Cloudflare R2
            const [thumbUrl, fullUrl] = await Promise.all([
                uploadToR2(thumbBuffer, `thumb_${filename}`, 'produtos'),
                uploadToR2(fullBuffer, `full_${filename}`, 'produtos')
            ]);

            // C. Monta o objeto que o Controller espera
            return {
                id: uuidv4(),
                url_thumb: thumbUrl,
                url_full: fullUrl,
                is_main: index === 0 // A primeira foto é a capa
            };
        });

        // Aguarda todos os uploads terminarem
        req.processedImages = await Promise.all(uploadPromises);
        
        console.log('Imagens processadas com sucesso:', req.processedImages.length);
        next();

    } catch (error) {
        console.error('ERRO FATAL NO UPLOAD:', error);
        return res.status(500).json({ 
            status: 'error', 
            message: 'Falha ao processar imagens no servidor.',
            debug: error.message 
        });
    }
};

module.exports = {
    // 'photos' deve bater com o Frontend
    uploadArray: upload.array('photos', 10), 
    optimizeAndUploadImages
};