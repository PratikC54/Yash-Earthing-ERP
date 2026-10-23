import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import app from "../src/app.js";

describe("CORS Security & Preflight Configuration", () => {
  let server;
  let baseUrl;

  before(async () => {
    server = app.listen(0);
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  after((done) => {
    server.close(done);
  });

  it("1. Allows requests from http://localhost:5173 with credentials", async () => {
    const res = await fetch(`${baseUrl}/api/health`, {
      method: "GET",
      headers: {
        Origin: "http://localhost:5173",
      },
    });

    assert.equal(res.status, 200);
    assert.equal(res.headers.get("access-control-allow-origin"), "http://localhost:5173");
    assert.equal(res.headers.get("access-control-allow-credentials"), "true");
  });

  it("2. Allows requests from http://127.0.0.1:5173 with credentials", async () => {
    const res = await fetch(`${baseUrl}/api/health`, {
      method: "GET",
      headers: {
        Origin: "http://127.0.0.1:5173",
      },
    });

    assert.equal(res.status, 200);
    assert.equal(res.headers.get("access-control-allow-origin"), "http://127.0.0.1:5173");
    assert.equal(res.headers.get("access-control-allow-credentials"), "true");
  });

  it("3. Handles OPTIONS preflight requests for http://127.0.0.1:5173", async () => {
    const res = await fetch(`${baseUrl}/api/production-quality/planning/dashboard`, {
      method: "OPTIONS",
      headers: {
        Origin: "http://127.0.0.1:5173",
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "Authorization,Content-Type",
      },
    });

    assert.equal(res.status, 204);
    assert.equal(res.headers.get("access-control-allow-origin"), "http://127.0.0.1:5173");
    assert.equal(res.headers.get("access-control-allow-credentials"), "true");
    const allowHeaders = res.headers.get("access-control-allow-headers") || "";
    assert.ok(allowHeaders.toLowerCase().includes("authorization"));
    assert.ok(allowHeaders.toLowerCase().includes("content-type"));
  });

  it("4. Handles OPTIONS preflight requests for http://localhost:5173", async () => {
    const res = await fetch(`${baseUrl}/api/pq/dashboard`, {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:5173",
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "Authorization",
      },
    });

    assert.equal(res.status, 204);
    assert.equal(res.headers.get("access-control-allow-origin"), "http://localhost:5173");
    assert.equal(res.headers.get("access-control-allow-credentials"), "true");
  });

  it("5. Rejects unauthorized origins", async () => {
    const res = await fetch(`${baseUrl}/api/health`, {
      method: "GET",
      headers: {
        Origin: "http://unauthorized-domain.com",
      },
    });

    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.message.includes("CORS"));
    assert.equal(res.headers.get("access-control-allow-origin"), null);
  });
});
