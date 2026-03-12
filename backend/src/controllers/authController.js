import { buildOAuthRedirect, createGoogleAuthRequest, loginWithGoogleCode, logoutUser } from '../services/authService.js';

const assertRequired = (value, fieldName) => {
  if (!value || !String(value).trim()) {
    const error = new Error(`${fieldName} is required`);
    error.status = 400;
    throw error;
  }
};

const googleAuthStart = (request, response, next) => {
  try {
    const { url } = createGoogleAuthRequest();
    response.redirect(url);
  } catch (error) {
    next(error);
  }
};

const googleAuthCallback = async (request, response) => {
  try {
    const { code, state, error } = request.query;

    if (error) {
      response.redirect(buildOAuthRedirect({ error: String(error) }));
      return;
    }

    assertRequired(code, 'code');
    assertRequired(state, 'state');

    const result = await loginWithGoogleCode({
      code: String(code),
      state: String(state)
    });

    response.redirect(buildOAuthRedirect({ token: result.token }));
  } catch (caughtError) {
    response.redirect(buildOAuthRedirect({ error: caughtError.message }));
  }
};

const me = async (request, response) => {
  response.json({ user: request.user });
};

const logout = async (request, response, next) => {
  try {
    await logoutUser(request.authToken);
    response.status(204).send();
  } catch (error) {
    next(error);
  }
};

export { googleAuthCallback, googleAuthStart, logout, me };
