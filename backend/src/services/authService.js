import crypto from 'crypto';
import { createSession, deleteSessionByTokenHash, getSessionByTokenHash } from '../models/sessionModel.js';
import { createUser, getUserByEmail, getUserByGoogleId, updateUserGoogleProfile } from '../models/userModel.js';

const OAUTH_STATE_TTL_MS = 1000 * 60 * 10;

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
const base64UrlEncode = (value) => Buffer.from(value).toString('base64url');
const base64UrlDecode = (value) => Buffer.from(value, 'base64url').toString('utf8');

const getOAuthStateSecret = () => {
  const secret = process.env.OAUTH_STATE_SECRET || process.env.GOOGLE_CLIENT_SECRET;
  if (!secret) {
    const error = new Error('OAUTH_STATE_SECRET or GOOGLE_CLIENT_SECRET is required for OAuth state validation');
    error.status = 500;
    throw error;
  }

  return secret;
};

const signOAuthStatePayload = (payload) =>
  crypto.createHmac('sha256', getOAuthStateSecret()).update(payload).digest('base64url');

const hashPassword = (password, salt) =>
  new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(derivedKey.toString('hex'));
    });
  });

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  authProvider: user.authProvider,
  avatarUrl: user.avatarUrl ?? null
});

const createAppSession = async (user) => {
  const token = crypto.randomBytes(32).toString('hex');
  await createSession({ userId: user.id, tokenHash: hashToken(token) });

  return {
    token,
    user: sanitizeUser(user)
  };
};

const registerUser = async ({ name, email, password }) => {
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    const error = new Error('Email is already registered');
    error.status = 409;
    throw error;
  }

  const passwordSalt = crypto.randomBytes(16).toString('hex');
  const passwordHash = await hashPassword(password, passwordSalt);
  const user = await createUser({
    name,
    email,
    passwordHash,
    passwordSalt,
    authProvider: 'local'
  });

  return createAppSession(user);
};

const loginUser = async ({ email, password }) => {
  const user = await getUserByEmail(email);
  if (!user || !user.passwordHash || !user.passwordSalt) {
    const error = new Error('Invalid email or password');
    error.status = 401;
    throw error;
  }

  const passwordHash = await hashPassword(password, user.passwordSalt);
  if (passwordHash !== user.passwordHash) {
    const error = new Error('Invalid email or password');
    error.status = 401;
    throw error;
  }

  return createAppSession(user);
};

const getUserFromToken = async (token) => {
  if (!token) {
    return null;
  }

  const session = await getSessionByTokenHash(hashToken(token));
  if (!session) {
    return null;
  }

  return {
    id: session.userId,
    name: session.name,
    email: session.email,
    authProvider: session.authProvider,
    avatarUrl: session.avatarUrl ?? null
  };
};

const logoutUser = async (token) => {
  if (!token) {
    return;
  }

  await deleteSessionByTokenHash(hashToken(token));
};

const buildGoogleRedirectUri = () => process.env.GOOGLE_REDIRECT_URI ?? 'http://localhost:4000/api/auth/google/callback';
const buildFrontendSuccessUrl = () => process.env.FRONTEND_OAUTH_SUCCESS_URL ?? 'http://localhost:5173/auth/callback';
const buildFrontendErrorUrl = () => process.env.FRONTEND_OAUTH_ERROR_URL ?? 'http://localhost:5173/auth/callback';

const createGoogleAuthRequest = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    const error = new Error('GOOGLE_CLIENT_ID is not configured');
    error.status = 500;
    throw error;
  }

  const payload = JSON.stringify({
    nonce: crypto.randomBytes(16).toString('hex'),
    timestamp: Date.now()
  });
  const encodedPayload = base64UrlEncode(payload);
  const state = `${encodedPayload}.${signOAuthStatePayload(encodedPayload)}`;

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', buildGoogleRedirectUri());
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'openid email profile');
  url.searchParams.set('state', state);

  return {
    state,
    url: url.toString()
  };
};

const validateGoogleState = ({ state }) => {
  if (!state) {
    const error = new Error('Invalid or expired Google OAuth state');
    error.status = 401;
    throw error;
  }

  const [encodedPayload, signature] = state.split('.');
  if (!encodedPayload || !signature) {
    const error = new Error('Invalid or expired Google OAuth state');
    error.status = 401;
    throw error;
  }

  const expectedSignature = signOAuthStatePayload(encodedPayload);
  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    const error = new Error('Invalid or expired Google OAuth state');
    error.status = 401;
    throw error;
  }

  const payload = JSON.parse(base64UrlDecode(encodedPayload));
  if (!payload.timestamp || Date.now() - payload.timestamp > OAUTH_STATE_TTL_MS) {
    const error = new Error('Invalid or expired Google OAuth state');
    error.status = 401;
    throw error;
  }
};

const exchangeCodeForGoogleProfile = async (code) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    const error = new Error('Google OAuth credentials are not configured');
    error.status = 500;
    throw error;
  }

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: buildGoogleRedirectUri(),
      grant_type: 'authorization_code'
    })
  });

  if (!tokenResponse.ok) {
    const errorBody = await tokenResponse.text();
    throw new Error(`Google token exchange failed: ${tokenResponse.status} ${errorBody}`);
  }

  const tokenPayload = await tokenResponse.json();
  const accessToken = tokenPayload.access_token;

  const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!userInfoResponse.ok) {
    const errorBody = await userInfoResponse.text();
    throw new Error(`Google userinfo request failed: ${userInfoResponse.status} ${errorBody}`);
  }

  const profile = await userInfoResponse.json();
  if (!profile.sub || !profile.email) {
    throw new Error('Google profile response was incomplete');
  }

  return {
    googleId: profile.sub,
    email: profile.email.toLowerCase(),
    name: profile.name ?? profile.email,
    avatarUrl: profile.picture ?? null
  };
};

const loginWithGoogleCode = async ({ code, state }) => {
  validateGoogleState({ state });

  const profile = await exchangeCodeForGoogleProfile(code);
  let user = await getUserByGoogleId(profile.googleId);

  if (!user) {
    const existingUser = await getUserByEmail(profile.email);

    if (existingUser) {
      user = await updateUserGoogleProfile({
        id: existingUser.id,
        googleId: profile.googleId,
        name: profile.name,
        avatarUrl: profile.avatarUrl
      });
    } else {
      user = await createUser({
        name: profile.name,
        email: profile.email,
        googleId: profile.googleId,
        authProvider: 'google',
        avatarUrl: profile.avatarUrl
      });
    }
  }

  return createAppSession(user);
};

const buildOAuthRedirect = ({ token, error }) => {
  const targetUrl = new URL(error ? buildFrontendErrorUrl() : buildFrontendSuccessUrl());
  if (token) {
    targetUrl.searchParams.set('token', token);
  }
  if (error) {
    targetUrl.searchParams.set('error', error);
  }
  return targetUrl.toString();
};

export {
  buildOAuthRedirect,
  createGoogleAuthRequest,
  getUserFromToken,
  loginUser,
  loginWithGoogleCode,
  logoutUser,
  registerUser
};
