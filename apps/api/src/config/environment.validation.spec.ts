import { validateEnvironment } from './environment.validation';

const validConfig = {
  POSTGRES_HOST: 'localhost',
  POSTGRES_PORT: '5432',
  POSTGRES_USER: 'gedpro',
  POSTGRES_PASSWORD: 'secret',
  POSTGRES_DB: 'gedpro',
  MONGODB_URI: 'mongodb://localhost/gedpro',
  JWT_SECRET: 'a-secure-development-secret-with-32-chars',
  JWT_REFRESH_SECRET: 'a-different-refresh-secret-with-32-chars',
};

describe('validateEnvironment', () => {
  it('normalizes numeric ports', () => {
    expect(validateEnvironment(validConfig)).toMatchObject({
      POSTGRES_PORT: 5432,
      PORT: 3001,
    });
  });

  it('reports missing required variables', () => {
    expect(() =>
      validateEnvironment({ ...validConfig, MONGODB_URI: '' }),
    ).toThrow('MONGODB_URI');
  });

  it('rejects schema synchronization in production', () => {
    expect(() =>
      validateEnvironment({
        ...validConfig,
        NODE_ENV: 'production',
        DB_SYNCHRONIZE: 'true',
      }),
    ).toThrow('DB_SYNCHRONIZE');
  });
});
