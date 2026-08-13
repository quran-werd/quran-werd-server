import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export type GoogleUserPayload = {
  googleId: string;
  email: string;
  name: string;
};

// Dev-only bypass so /auth/google can be tested (e.g. from Postman) without a
// real Google ID token. Requires AUTH_MOCK_GOOGLE=true *and* the token itself
// to carry the "mock:" prefix, so a real Google token is never affected even
// if the flag is left on by accident. Never set AUTH_MOCK_GOOGLE in production.
//
// The payload after "mock:" is base64-encoded JSON, not raw JSON — a raw
// JSON payload contains literal double quotes, which break when Postman
// substitutes {{idToken}} straight into the surrounding JSON request body
// (no escaping happens on variable substitution).
const MOCK_PREFIX = "mock:";

const verifyMockIdToken = (idToken: string): GoogleUserPayload | null => {
  try {
    const decoded = Buffer.from(
      idToken.slice(MOCK_PREFIX.length),
      "base64"
    ).toString("utf8");
    const payload = JSON.parse(decoded);
    if (!payload.googleId || !payload.email) {
      return null;
    }
    return {
      googleId: payload.googleId,
      email: payload.email,
      name: payload.name || payload.email,
    };
  } catch {
    return null;
  }
};

export const verifyGoogleIdToken = async (
  idToken: string
): Promise<GoogleUserPayload | null> => {
  if (process.env.AUTH_MOCK_GOOGLE === "true" && idToken.startsWith(MOCK_PREFIX)) {
    return verifyMockIdToken(idToken);
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email) {
      return null;
    }

    return {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name || payload.email,
    };
  } catch {
    return null;
  }
};
