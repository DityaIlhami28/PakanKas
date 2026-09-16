const requiredEnvironmentVariables = [
  'DATABASE_URL',
  'ACCESS_TOKEN_SECRET',
  'REFRESH_TOKEN_SECRET',
] as const;

export const getRequiredEnvironmentVariable = (name: string) => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

export const validateEnvironment = () => {
  for (const name of requiredEnvironmentVariables) {
    getRequiredEnvironmentVariable(name);
  }
};
