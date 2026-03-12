import { getUserFromToken } from '../services/authService.js';

const extractToken = (authorizationHeader) => {
  if (!authorizationHeader?.startsWith('Bearer ')) {
    return null;
  }

  return authorizationHeader.slice('Bearer '.length).trim();
};

const requireAuth = async (request, _response, next) => {
  try {
    const token = extractToken(request.headers.authorization);
    const user = await getUserFromToken(token);

    if (!user) {
      const error = new Error('Authentication required');
      error.status = 401;
      throw error;
    }

    request.user = user;
    request.authToken = token;
    next();
  } catch (error) {
    next(error);
  }
};

export { extractToken, requireAuth };
