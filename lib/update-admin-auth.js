import crypto from "crypto";

export const updateAdminCookieName = "FormUpdateAuth";
const sessionLifetimeMs = 8 * 60 * 60 * 1000;

const getSecret = () =>
  process.env.UPDATE_AUDIT_SESSION_SECRET || process.env.UPDATE_AUDIT_PASSWORD;

const sign = (payload) =>
  crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");

export const createUpdateAdminToken = (userId) => {
  const payload = Buffer.from(
    JSON.stringify({ userId, expiresAt: Date.now() + sessionLifetimeMs }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
};

export const isUpdateAdminAuthenticated = (request) => {
  const token = request.cookies.get(updateAdminCookieName)?.value;
  const secret = getSecret();
  if (!token || !secret) return false;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const actual = Buffer.from(signature);
  const expected = Buffer.from(sign(payload));
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) {
    return false;
  }

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return Boolean(session.userId) && Number.isFinite(session.expiresAt) && session.expiresAt > Date.now();
  } catch {
    return false;
  }
};
