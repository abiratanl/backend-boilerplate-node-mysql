/**
 * Validates that all required environment variables are set.
 * If any are missing, the process will exit to prevent runtime errors.
 */
const validateEnv = () => {
  const requiredEnvVars = ['PORT', 'DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];

  const missingVars = requiredEnvVars.filter((key) => !process.env[key]);

  if (missingVars.length > 0) {
    console.error('❌ CRITICAL ERROR: Missing required environment variables:');
    missingVars.forEach((key) => {
      console.error(`   - ${key}`);
    });
    console.error('Please check your .env file.');

    // Exit the process with failure code
    process.exit(1);
  }
};

module.exports = validateEnv;
