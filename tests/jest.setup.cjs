const dotenv = require("dotenv");

dotenv.config();

process.env.NODE_ENV = "test";

if (!process.env.DB_NAME_TEST) {
  process.env.DB_NAME_TEST = process.env.DB_NAME || "citizen_security_v2";
}
