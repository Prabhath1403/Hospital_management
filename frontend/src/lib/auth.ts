import { api } from "./api";

export interface User {
  id: number;
  name: string;
  email: string;
  role: "patient" | "doctor" | "admin" | "lab_technician";
  phone?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: "patient" | "doctor";
}

export interface AuthResponse {
  token?: string;
  access_token?: string;
  user: User;
}

class AuthService {
  private readonly TOKEN_KEY = "token";
  private readonly USER_KEY = "user";

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/auth/login", payload);
    const { token, access_token, user } = response.data;
    
    // Handle both token formats
    const authToken = token || access_token;
    if (authToken) {
      this.setToken(authToken);
    }
    
    this.setUser(user);

    return response.data;
  }

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/auth/register", payload);
    const { token, access_token, user } = response.data;
    
    // Handle both token formats
    const authToken = token || access_token;
    if (authToken) {
      this.setToken(authToken);
    }
    
    this.setUser(user);

    return response.data;
  }

  logout(): void {
    this.removeToken();
    this.removeUser();
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  getUser(): User | null {
    const user = localStorage.getItem(this.USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  setUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  removeUser(): void {
    localStorage.removeItem(this.USER_KEY);
  }
}

export const authService = new AuthService();
