const REQUIRED_VARIABLES = [
  'POSTGRES_HOST',
  'POSTGRES_PORT',
  'POSTGRES_USER',
  'POSTGRES_PASSWORD',
  'POSTGRES_DB',
  'MONGODB_URI',
  'JWT_SECRET',
] as const;

export function validateEnvironment(config: Record<string, unknown>) {
  const missing = REQUIRED_VARIABLES.filter((key) => {
    const value = config[key];
    return typeof value !== 'string' || value.trim() === '';
  });

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  const postgresPort = Number(config.POSTGRES_PORT);
  const appPort = Number(config.PORT ?? 3000);
  if (!Number.isInteger(postgresPort) || postgresPort < 1 || postgresPort > 65535) {
    throw new Error('POSTGRES_PORT must be a valid TCP port');
  }
  if (!Number.isInteger(appPort) || appPort < 1 || appPort > 65535) {
    throw new Error('PORT must be a valid TCP port');
  }

  if (String(config.JWT_SECRET).length < 32) {
    throw new Error('JWT_SECRET must contain at least 32 characters');
  }

  if (config.NODE_ENV === 'production' && config.DB_SYNCHRONIZE === 'true') {
    throw new Error('DB_SYNCHRONIZE must not be enabled in production');
  }

  return {
    ...config,
    POSTGRES_PORT: postgresPort,
    PORT: appPort,
  };
}
