import axios, { AxiosInstance } from 'axios';
import Cookies from 'js-cookie';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '@/types/auth';

class ApiClient {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    });

    // Interceptor para agregar el token a las peticiones
    this.api.interceptors.request.use((config) => {
      const token = Cookies.get('auth-token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Interceptor para manejar errores de autenticación
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.logout();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/api/auth/login', data);
    if (response.data.token) {
      Cookies.set('auth-token', response.data.token, { expires: 1 }); // 1 día
    }
    return response.data;
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/api/auth/register', data);
    if (response.data.token) {
      Cookies.set('auth-token', response.data.token, { expires: 1 }); // 1 día
    }
    return response.data;
  }

  async getProfile(): Promise<User> {
    const response = await this.api.get<{ user: User }>('/api/auth/profile');
    return response.data.user;
  }

  async verifyToken(): Promise<boolean> {
    try {
      await this.api.get('/api/auth/verify');
      return true;
    } catch {
      return false;
    }
  }

  logout(): void {
    Cookies.remove('auth-token');
  }

  getToken(): string | undefined {
    return Cookies.get('auth-token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export const apiClient = new ApiClient();