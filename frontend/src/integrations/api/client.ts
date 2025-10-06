// API client for Flask backend
// This replaces the Supabase client with our Flask backend

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://dkdrn34xpx.us-east-1.awsapprunner.com/api";

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

  async getUsers() {
    return this.request('/auth/users');
  }

  // People methods
  async getPeople() {
    return this.request('/people');
  }

  async createPerson(personData: any) {
    console.log('🔍 API CLIENT DEBUG - Creating person with data:', personData);
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
  async getProjects() {
    return this.request('/projects');
  }

  async getTasks(project?: string, status?: string, includeScheduled: boolean = true) {
    const params = new URLSearchParams();
    if (project) params.append('project', project);
    if (status) params.append('status', status);
    params.append('include_scheduled', includeScheduled.toString());
    
    const queryString = params.toString();
    return this.request(queryString ? `/tasks?${queryString}` : '/tasks');
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

  // Events methods
  async getEvents(startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    const queryString = params.toString();
    return this.request(queryString ? `/events?${queryString}` : '/events');
  }

  async createEvent(eventData: any) {
    return this.request('/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  }

  async updateEvent(id: number, eventData: any) {
    return this.request(`/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    });
  }

  async deleteEvent(id: number) {
    return this.request(`/events/${id}`, {
      method: 'DELETE',
    });
  }

  async getUpcomingEvents() {
    return this.request('/events/upcoming');
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

  async connectWhatsapp(whatsappPhone: string) {
    return this.request('/whatsapp/connect', {
      method: 'POST',
      body: JSON.stringify({ whatsapp_phone_number: whatsappPhone }),
    });
  }

  async disconnectWhatsapp() {
    return this.request('/whatsapp/disconnect', {
      method: 'POST',
    });
  }

  async updatePreferredPlatform(platform: string) {
    return this.request('/auth/preferred-platform', {
      method: 'POST',
      body: JSON.stringify({ preferred_messaging_platform: platform }),
    });
  }

  // Admin methods
  async getAllUsers() {
    return this.request('/admin/users');
  }

  async getPendingUsers() {
    return this.request('/admin/pending-users');
  }

  async approveUser(userId: string) {
    return this.request(`/admin/users/${userId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ approved: true }),
    });
  }

  async rejectUser(userId: string) {
    return this.request(`/admin/users/${userId}/reject`, {
      method: 'POST',
    });
  }

  async deleteUser(userId: string) {
    return this.request(`/admin/users/${userId}`, {
      method: 'DELETE',
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
  // User Group methods
  async getUserGroup() {
    return this.request('/user-group');
  }

  async getGroupUsers() {
    return this.request('/user-group');
  }

  async addUserToGroup(email: string, name: string) {
    return this.request('/user-group', {
      method: 'POST',
      body: JSON.stringify({ email, name }),
    });
  }

  async removeUserFromGroup(id: string) {
    return this.request(`/user-group/${id}`, {
      method: 'DELETE',
    });
  }

  // Group invitation methods
  async getPendingInvitations() {
    return this.request('/user-group/pending-invitations');
  }

  async approveInvitation(invitationId: string, displayName?: string) {
    return this.request('/user-group/approve-invitation', {
      method: 'POST',
      body: JSON.stringify({ 
        invitation_id: invitationId,
        display_name: displayName || ''
      }),
    });
  }

  async declineInvitation(invitationId: string) {
    return this.request('/user-group/decline-invitation', {
      method: 'POST',
      body: JSON.stringify({ invitation_id: invitationId }),
    });
  }

  // Share contacts with group members
  async shareContacts(userIds: string[]) {
    return this.request('/people/share', {
      method: 'POST',
      body: JSON.stringify({ user_ids: userIds }),
    });
  }

  isAuthenticated() {
    return !!this.token;
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
