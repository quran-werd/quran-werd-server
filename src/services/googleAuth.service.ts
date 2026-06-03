import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export type GoogleUserPayload = {
  googleId: string;
  email: string;
  name: string;
};

export const verifyGoogleIdToken = async (
  idToken: string
): Promise<GoogleUserPayload | null> => {
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
