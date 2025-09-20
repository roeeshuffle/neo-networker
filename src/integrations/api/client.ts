// API client for Flask backend
// This replaces the Supabase client with our Flask backend

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:5002/api" : "https://dkdrn34xpx.us-east-1.awsapprunner.com/api");

interface ApiResponse<T> {
  data: T | null;
  error: any;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return { data: null, error: data };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Auth methods
  async register(email: string, password: string, name: string) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  }

  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // People methods
  async getPeople() {
    return this.request('/people');
  }

  async createPerson(personData: any) {
    return this.request('/people', {
      method: 'POST',
      body: JSON.stringify(personData),
    });
  }

  async updatePerson(id: string, personData: any) {
    return this.request(`/people/${id}`, {
      method: 'PUT',
      body: JSON.stringify(personData),
    });
  }

  async deletePerson(id: string) {
    return this.request(`/people/${id}`, {
      method: 'DELETE',
    });
  }

  // Companies methods
  async getCompanies() {
    return this.request('/companies');
  }

  async createCompany(companyData: any) {
    return this.request('/companies', {
      method: 'POST',
      body: JSON.stringify(companyData),
    });
  }

  async updateCompany(id: string, companyData: any) {
    return this.request(`/companies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(companyData),
    });
  }

  async deleteCompany(id: string) {
    return this.request(`/companies/${id}`, {
      method: 'DELETE',
    });
  }

  // Tasks methods
  async getTasks() {
    return this.request('/tasks');
  }

  async createTask(taskData: any) {
    return this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  }

  async updateTask(id: string, taskData: any) {
    return this.request(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(taskData),
    });
  }

  async deleteTask(id: string) {
    return this.request(`/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  // Telegram methods
  async getTelegramStatus() {
    return this.request('/telegram/status');
  }

  async connectTelegram(telegramId: string) {
    return this.request('/telegram/connect', {
      method: 'POST',
      body: JSON.stringify({ telegram_id: telegramId }),
    });
  }

  async disconnectTelegram() {
    return this.request('/telegram/disconnect', {
      method: 'POST',
    });
  }

  // Admin methods
  async getPendingUsers() {
    return this.request('/admin/pending-users');
  }

  async approveUser(userId: string) {
    return this.request(`/admin/approve-user/${userId}`, {
      method: 'POST',
    });
  }

  async rejectUser(userId: string) {
    return this.request(`/admin/reject-user/${userId}`, {
      method: 'POST',
    });
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }

  // Set auth token
  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.token;
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
