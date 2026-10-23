import crypto from "node:crypto";
import { env } from "../config/env.js";

const JWT_SECRET = Buffer.from(env.JWT_SECRET, "utf8");
const JWT_ALGORITHM = "HS256";
const CLOCK_TOLERANCE_SECONDS = 30;

function base64UrlEncode(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function base64UrlDecode(value) {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new Error("Invalid base64url value");
  }

  const decoded = Buffer.from(value, "base64url");
  if (decoded.toString("base64url") !== value) {
    throw new Error("Invalid base64url encoding");
  }

  return JSON.parse(decoded.toString("utf8"));
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function signToken(payload, expiresInSeconds = 7 * 24 * 60 * 60) {
  if (!isRecord(payload)) {
    throw new TypeError("JWT payload must be an object.");
  }
  if (!Number.isInteger(expiresInSeconds) || expiresInSeconds <= 0) {
    throw new RangeError("JWT expiry must be a positive number of seconds.");
  }

  const issuedAt = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode({ alg: JWT_ALGORITHM, typ: "JWT" });
  const claims = base64UrlEncode({
    ...payload,
    iat: issuedAt,
    exp: issuedAt + expiresInSeconds,
  });
  const signingInput = `${header}.${claims}`;
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(signingInput)
    .digest("base64url");

  return `${signingInput}.${signature}`;
}

export function verifyToken(token) {
  if (typeof token !== "string" || token.length === 0 || token.length > 8192) {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;

  try {
    const header = base64UrlDecode(encodedHeader);
    if (!isRecord(header) || header.alg !== JWT_ALGORITHM || header.typ !== "JWT") {
      return null;
    }

    if (!/^[A-Za-z0-9_-]+$/.test(encodedSignature)) {
      return null;
    }

    const signature = Buffer.from(encodedSignature, "base64url");
    if (signature.toString("base64url") !== encodedSignature) {
      return null;
    }
    const expectedSignature = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest();

    if (
      signature.length !== expectedSignature.length ||
      !crypto.timingSafeEqual(signature, expectedSignature)
    ) {
      return null;
    }

    const payload = base64UrlDecode(encodedPayload);
    if (
      !isRecord(payload) ||
      !Number.isInteger(payload.iat) ||
      !Number.isInteger(payload.exp) ||
      (payload.nbf !== undefined && !Number.isInteger(payload.nbf)) ||
      payload.exp <= payload.iat
    ) {
      return null;
    }

    const now = Math.floor(Date.now() / 1000);
    if (payload.iat > now + CLOCK_TOLERANCE_SECONDS) {
      return null;
    }
    if (Number.isFinite(payload.nbf) && payload.nbf > now + CLOCK_TOLERANCE_SECONDS) {
      return null;
    }
    if (payload.exp <= now) {
      return { expired: true };
    }

    return payload;
  } catch {
    return null;
  }
}
