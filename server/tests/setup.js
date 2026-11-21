import dotenv from "dotenv";

dotenv.config({ quiet: true });

const testUri = process.env.MONGODB_URI_TEST;

if (!testUri) {
  throw new Error("MONGODB_URI_TEST is not set. Add a separate test database URI to server/.env");
}

const databaseName = new URL(testUri).pathname.replace("/", "");

// Safety net: tests delete data, so never let them touch a real database.
if (!databaseName.endsWith("-test")) {
  throw new Error(`Refusing to run tests: database name "${databaseName}" must end with "-test"`);
}

process.env.NODE_ENV = "test";
process.env.MONGODB_URI = testUri;
process.env.JWT_SECRET = "test-secret-test-secret-test-secret-123456";
process.env.GEMINI_API_KEY = "test-key";
process.env.GEMINI_MODEL = "test-model";
process.env.CLIENT_URL = "http://localhost:5173";
process.env.BCRYPT_ROUNDS = "4";
process.env.SKIP_RATE_LIMITS = "true";