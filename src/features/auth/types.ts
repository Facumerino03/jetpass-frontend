export type UserPublic = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  role: string;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type LoginRequest = {
  email: string;
  password: string;
  device_name?: string | null;
};

export type PilotRegisterRequest = {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  device_name?: string | null;
};

export type AuthTokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: UserPublic;
};

export type RefreshRequest = {
  refresh_token: string;
};

export type AuthSession = AuthTokenResponse & {
  expires_at: number;
};
