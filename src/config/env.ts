import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  r2: {
    accountId: process.env.R2_ACCOUNT_ID || '',
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    bucketName: process.env.R2_BUCKET_NAME || 'fara-media',
    endpoint: process.env.R2_ENDPOINT || (process.env.R2_ACCOUNT_ID ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : ''),
    publicBaseUrl: process.env.R2_PUBLIC_BASE_URL || '',
  },
  privateAppToken: process.env.PRIVATE_APP_TOKEN || '',
  maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || '100', 10),
  tempFileMaxAgeMinutes: parseInt(process.env.TEMP_FILE_MAX_AGE_MINUTES || '30', 10),
};

export const hasR2Config = (): boolean => {
  return Boolean(
    config.r2.accessKeyId &&
    config.r2.secretAccessKey &&
    config.r2.bucketName &&
    (config.r2.endpoint || config.r2.accountId)
  );
};
