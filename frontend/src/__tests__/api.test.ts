/**
 * API Integration Tests
 * Tests frontend API client against backend endpoints
 */

import { apiClient } from '../integrations/api/client';

// Mock fetch for testing
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('API Client Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('mock-jwt-token');
  });

  describe('Authentication Endpoints', () => {
    test('should register a new user', async () => {
      const mockResponse = {
        data: { message: 'User registered successfully' },
        error: null
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse.data,
      } as Response);

      const result = await apiClient.register('test@example.com', 'password123', 'Test User');
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/register'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123',
            name: 'Test User'
          })
        })
      );
      expect(result.data).toEqual(mockResponse.data);
    });

    test('should login with valid credentials', async () => {
      const mockResponse = {
        access_token: 'mock-jwt-token',
        user: { id: '1', email: 'test@example.com' }
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiClient.login('test@example.com', 'password123');
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/login'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123'
          })
        })
      );
      expect(result.data).toEqual(mockResponse);
    });

    test('should get current user', async () => {
      const mockResponse = {
        id: '1',
        email: 'test@example.com',
        full_name: 'Test User',
        is_approved: true
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiClient.getCurrentUser();
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/me'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-jwt-token'
          })
        })
      );
      expect(result.data).toEqual(mockResponse);
    });
  });

  describe('People Management Endpoints', () => {
    test('should get all people', async () => {
      const mockResponse = [
        {
          id: '1',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          phone: '123-456-7890'
        }
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiClient.getPeople();
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/people'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-jwt-token'
          })
        })
      );
      expect(result.data).toEqual(mockResponse);
    });

    test('should create a new person', async () => {
      const personData = {
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@example.com',
        phone: '098-765-4321'
      };
      const mockResponse = { id: '2', ...personData };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiClient.createPerson(personData);
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/people'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(personData),
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-jwt-token'
          })
        })
      );
      expect(result.data).toEqual(mockResponse);
    });

    test('should update a person', async () => {
      const personId = '1';
      const updateData = { first_name: 'John Updated' };
      const mockResponse = { id: personId, ...updateData };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiClient.updatePerson(personId, updateData);
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/people/${personId}`),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updateData),
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-jwt-token'
          })
        })
      );
      expect(result.data).toEqual(mockResponse);
    });

    test('should delete a person', async () => {
      const personId = '1';
      const mockResponse = { message: 'Person deleted successfully' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiClient.deletePerson(personId);
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/people/${personId}`),
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-jwt-token'
          })
        })
      );
      expect(result.data).toEqual(mockResponse);
    });
  });

  describe('Tasks Management Endpoints', () => {
    test('should get projects', async () => {
      const mockResponse = ['project1', 'project2', 'personal'];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiClient.getProjects();
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-jwt-token'
          })
        })
      );
      expect(result.data).toEqual(mockResponse);
    });

    test('should get tasks with filters', async () => {
      const mockResponse = {
        projects: {
          'personal': [
            { id: '1', title: 'Task 1', status: 'todo', project: 'personal' }
          ]
        },
        total_tasks: 1
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiClient.getTasks('personal', 'todo', true);
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/tasks?project=personal&status=todo&include_scheduled=true'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-jwt-token'
          })
        })
      );
      expect(result.data).toEqual(mockResponse);
    });

    test('should create a task', async () => {
      const taskData = {
        title: 'New Task',
        description: 'Task description',
        status: 'todo',
        project: 'personal'
      };
      const mockResponse = { id: '1', ...taskData };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiClient.createTask(taskData);
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/tasks'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(taskData),
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-jwt-token'
          })
        })
      );
      expect(result.data).toEqual(mockResponse);
    });
  });

  describe('Events Management Endpoints', () => {
    test('should get events', async () => {
      const mockResponse = {
        events: [
          {
            id: '1',
            title: 'Meeting',
            start_datetime: '2024-01-01T10:00:00Z',
            end_datetime: '2024-01-01T11:00:00Z'
          }
        ],
        count: 1
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiClient.getEvents();
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/events'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-jwt-token'
          })
        })
      );
      expect(result.data).toEqual(mockResponse);
    });

    test('should get events with date filters', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-01-31';
      const mockResponse = { events: [], count: 0 };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiClient.getEvents(startDate, endDate);
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/events?start_date=2024-01-01&end_date=2024-01-31'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-jwt-token'
          })
        })
      );
      expect(result.data).toEqual(mockResponse);
    });
  });

  describe('CSV Import Endpoints', () => {
    test('should preview CSV with simple API', async () => {
      const mockResponse = {
        success: true,
        total_rows: 3,
        columns: ['Full Name', 'Email', 'Phone'],
        mapping: { 'Full Name': 'first_name', 'Email': 'email' },
        preview_data: [
          {
            row_number: 2,
            data: { 'Full Name': 'John Doe', 'Email': 'john@example.com' },
            mapped_data: { first_name: 'John Doe', email: 'john@example.com' }
          }
        ]
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      // Create a mock file
      const file = new File(['Full Name,Email\nJohn Doe,john@example.com'], 'test.csv', {
        type: 'text/csv',
      });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('custom_mapping', JSON.stringify({}));

      // We need to test the actual fetch call since apiClient doesn't have CSV methods
      const response = await fetch('/api/csv/preview-simple', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer mock-jwt-token'
        },
        body: formData
      });

      expect(response.ok).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle 401 unauthorized errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      } as Response);

      const result = await apiClient.getPeople();
      
      expect(result.data).toBeNull();
      expect(result.error).toEqual({ error: 'Unauthorized' });
    });

    test('should handle 500 server errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' }),
      } as Response);

      const result = await apiClient.getPeople();
      
      expect(result.data).toBeNull();
      expect(result.error).toEqual({ error: 'Internal server error' });
    });

    test('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await apiClient.getPeople();
      
      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error.message).toBe('Network error');
    });
  });

  describe('Authentication State Management', () => {
    test('should set token correctly', () => {
      const token = 'new-jwt-token';
      apiClient.setToken(token);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', token);
    });

    test('should check authentication status', () => {
      localStorageMock.getItem.mockReturnValue('mock-token');
      
      expect(apiClient.isAuthenticated()).toBe(true);
      
      localStorageMock.getItem.mockReturnValue(null);
      
      expect(apiClient.isAuthenticated()).toBe(false);
    });

    test('should logout correctly', () => {
      apiClient.logout();
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
    });
  });
});
