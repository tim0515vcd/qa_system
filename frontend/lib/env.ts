function getRequiredPublicEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

export const env = {
  NEXT_PUBLIC_API_BASE:
    process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000",
};