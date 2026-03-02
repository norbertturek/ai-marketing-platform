export type JwtPayload = {
  sub: string;
  email: string;
};

export type AuthenticatedUser = {
  userId: string;
  email: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthResponse = {
  user: {
    id: string;
    email: string;
  };
  tokens: AuthTokens;
};
