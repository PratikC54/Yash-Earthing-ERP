import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";
import { authenticateUser } from "../src/middleware/authenticateUser.js";
import { signToken, verifyToken } from "../src/utils/jwt.js";

const testSecret = process.env.JWT_SECRET;

function encode(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function makeToken(header, payload) {
  const input = `${encode(header)}.${encode(payload)}`;
  const signature = crypto
    .createHmac("sha256", testSecret)
    .update(input)
    .digest("base64url");
  return `${input}.${signature}`;
}

test("signs and verifies a token with required time claims", () => {
  const token = signToken({ id: 42, role: "ADMIN" });
  const verified = verifyToken(token);

  assert.equal(verified.id, 42);
  assert.equal(verified.role, "ADMIN");
  assert.equal(Number.isInteger(verified.iat), true);
  assert.equal(verified.exp > verified.iat, true);
});

test("rejects tampered, malformed, and non-HS256 tokens", () => {
  const validToken = signToken({ id: 42 });
  const [header, payload, signature] = validToken.split(".");
  const modifiedSignature = `${signature.slice(0, -1)}${signature.endsWith("A") ? "B" : "A"}`;

  assert.equal(verifyToken(`${header}.${payload}.${modifiedSignature}`), null);
  assert.equal(verifyToken("not-a-jwt"), null);
  assert.equal(
    verifyToken(makeToken({ alg: "none", typ: "JWT" }, { id: 42, iat: 1, exp: 2 })),
    null
  );
});

test("rejects tokens with missing or malformed time claims", () => {
  assert.equal(
    verifyToken(makeToken({ alg: "HS256", typ: "JWT" }, { id: 42, iat: 1 })),
    null
  );
  assert.equal(
    verifyToken(
      makeToken({ alg: "HS256", typ: "JWT" }, { id: 42, iat: 1, exp: 2, nbf: "soon" })
    ),
    null
  );
});

test("marks expired tokens and rejects tokens that are not active yet", () => {
  const now = Math.floor(Date.now() / 1000);
  const expiredToken = makeToken(
    { alg: "HS256", typ: "JWT" },
    { id: 42, iat: now - 60, exp: now - 1 }
  );
  const inactiveToken = makeToken(
    { alg: "HS256", typ: "JWT" },
    { id: 42, iat: now, exp: now + 60, nbf: now + 60 }
  );

  assert.deepEqual(verifyToken(expiredToken), { expired: true });
  assert.equal(verifyToken(inactiveToken), null);
});

test("rejects an invalid bearer token without falling back to a session cookie", async () => {
  const error = await new Promise((resolve) => {
    authenticateUser(
      {
        headers: { authorization: "Bearer invalid-token" },
        cookies: { sessionId: "valid-session-id" },
      },
      {},
      resolve
    );
  });

  assert.equal(error.statusCode, 401);
});
