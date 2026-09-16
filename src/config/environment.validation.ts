const REQUIRED_VARIABLES = [
  'POSTGRES_HOST',
  'POSTGRES_PORT',
  'POSTGRES_USER',
  'POSTGRES_PASSWORD',
  'POSTGRES_DB',
  'MONGODB_URI',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
] as const;

export function validateEnvironment(config: Record<string, unknown>) {
  const missing = REQUIRED_VARIABLES.filter((key) => {
    const value = config[key];
    return typeof value !== 'string' || value.trim() === '';
  });

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`,
    );
  }

  const postgresPort = Number(config.POSTGRES_PORT);
  const appPort = Number(config.PORT ?? 3000);
  if (
    !Number.isInteger(postgresPort) ||
    postgresPort < 1 ||
    postgresPort > 65535
  ) {
    throw new Error('POSTGRES_PORT must be a valid TCP port');
  }
  if (!Number.isInteger(appPort) || appPort < 1 || appPort > 65535) {
    throw new Error('PORT must be a valid TCP port');
  }

  if (String(config.JWT_SECRET).length < 32) {
    throw new Error('JWT_SECRET must contain at least 32 characters');
  }
  if (String(config.JWT_REFRESH_SECRET).length < 32)
    throw new Error('JWT_REFRESH_SECRET must contain at least 32 characters');
  if (
    config.EMAIL_WEBHOOK_SECRET &&
    String(config.EMAIL_WEBHOOK_SECRET).length < 32
  )
    throw new Error('EMAIL_WEBHOOK_SECRET must contain at least 32 characters');
  for (const key of [
    'ACCESS_TOKEN_TTL_SECONDS',
    'REFRESH_TOKEN_TTL_SECONDS',
    'ACTION_TOKEN_TTL_SECONDS',
    'LOGIN_MAX_ATTEMPTS',
    'LOGIN_LOCKOUT_SECONDS',
    'RATE_LIMIT_WINDOW_SECONDS',
    'RATE_LIMIT_MAX',
    'AUTH_RATE_LIMIT_MAX',
    'EMAIL_MAX_ATTEMPTS',
    'JOB_POLL_INTERVAL_MS',
  ]) {
    if (
      config[key] !== undefined &&
      (!Number.isInteger(Number(config[key])) || Number(config[key]) < 1)
    )
      throw new Error(`${key} must be a positive integer`);
  }

  if (config.NODE_ENV === 'production' && config.DB_SYNCHRONIZE === 'true') {
    throw new Error('DB_SYNCHRONIZE must not be enabled in production');
  }
  const storage =
    config.DOCUMENT_STORAGE_PROVIDER ??
    (config.NODE_ENV === 'production' ? 's3' : 'local');
  if (!['local', 's3'].includes(String(storage)))
    throw new Error('DOCUMENT_STORAGE_PROVIDER must be local or s3');
  if (config.NODE_ENV === 'production' && storage !== 's3')
    throw new Error('Production document storage must use s3');
  if (storage === 's3')
    for (const key of [
      'S3_ENDPOINT',
      'S3_ACCESS_KEY',
      'S3_SECRET_KEY',
      'S3_BUCKET',
    ])
      if (!config[key])
        throw new Error(`${key} is required for s3 document storage`);

  return {
    ...config,
    POSTGRES_PORT: postgresPort,
    PORT: appPort,
  };
}
