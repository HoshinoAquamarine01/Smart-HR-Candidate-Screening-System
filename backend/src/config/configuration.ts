export default () => ({
    port: process.env.PORT || 3000,
    mongoUri: process.env.MONGO_URI,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiration: process.env.JWT_EXPIRATION,
    openaiKey: process.env.OPENAI_KEY,
    minioEndpoint: process.env.MINIO_ENDPOINT,
    minioPort: process.env.MINIO_PORT,
    minioAccessKey: process.env.MINIO_ACCESS_KEY,
    minioSecretKey: process.env.MINIO_SECRET_KEY,
    minioBucketName: process.env.MINIO_BUCKET_NAME,
})