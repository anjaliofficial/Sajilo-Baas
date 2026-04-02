import dotenv from "dotenv";
dotenv.config();

// PORT
export const PORT: number = process.env.PORT ? Number(process.env.PORT) : 5050;

// MongoDB URI
export const MONGODB_URI: string = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/SajiloBaas";

// JWT secret
export const JWT_SECRET: string = process.env.JWT_SECRET || "mero_secret";
