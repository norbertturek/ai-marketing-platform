export type JwtPayload = {
  sub: string; // todo what is this?
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
