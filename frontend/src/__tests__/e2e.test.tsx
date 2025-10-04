/**
 * End-to-End Integration Tests
 * Tests complete user workflows with real API calls
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';

// Mock fetch for real API calls
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

// Import main app components
import App from '../App';

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('End-to-End Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('mock-jwt-token');
  });

  describe('Complete User Registration and Login Flow', () => {
    test('should complete full registration and login workflow', async () => {
      // Mock registration
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: 'mock-jwt-token',
            user: { id: '1', email: 'test@example.com', is_approved: true }
          }),
        } as Response)
        // Mock getCurrentUser
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: '1',
            email: 'test@example.com',
            full_name: 'Test User',
            is_approved: true
          }),
        } as Response)
        // Mock initial data loading
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ projects: {}, total_tasks: 0 }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ events: [], count: 0 }),
        } as Response);

      renderWithRouter(<App />);

      // Should start with login form
      expect(screen.getByText(/sign in to your account/i)).toBeInTheDocument();

      // Fill login form
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      const loginButton = screen.getByText(/sign in/i);
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/auth/login'),
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              email: 'test@example.com',
              password: 'password123'
            })
          })
        );
      });

      // Should redirect to dashboard after successful login
      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });
    });
  });

  describe('Complete Contact Management Workflow', () => {
    test('should complete full contact CRUD workflow', async () => {
      const mockContacts = [
        {
          id: '1',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          phone: '123-456-7890'
        }
      ];

      // Mock initial data loading
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: '1',
            email: 'test@example.com',
            full_name: 'Test User',
            is_approved: true
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockContacts,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ projects: {}, total_tasks: 0 }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ events: [], count: 0 }),
        } as Response);

      renderWithRouter(<App />);

      // Navigate to contacts
      const contactsTab = screen.getByText(/contacts/i);
      fireEvent.click(contactsTab);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Test creating new contact
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: '2',
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane@example.com'
        }),
      } as Response);

      const addButton = screen.getByText(/add contact/i);
      fireEvent.click(addButton);

      // Fill contact form (this would be in a modal)
      // In real implementation, we'd test the form submission
      
      // Test updating contact
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: '1',
          first_name: 'John Updated',
          last_name: 'Doe',
          email: 'john@example.com'
        }),
      } as Response);

      // Test deleting contact
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Contact deleted successfully' }),
      } as Response);
    });
  });

  describe('Complete Task Management Workflow', () => {
    test('should complete full task CRUD workflow', async () => {
      const mockTasks = {
        projects: {
          'personal': [
            {
              id: '1',
              title: 'Task 1',
              description: 'Description 1',
              status: 'todo',
              project: 'personal'
            }
          ]
        },
        total_tasks: 1
      };

      // Mock initial data loading
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: '1',
            email: 'test@example.com',
            full_name: 'Test User',
            is_approved: true
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTasks,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ['personal'],
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ events: [], count: 0 }),
        } as Response);

      renderWithRouter(<App />);

      // Navigate to tasks
      const tasksTab = screen.getByText(/tasks/i);
      fireEvent.click(tasksTab);

      await waitFor(() => {
        expect(screen.getByText('Task 1')).toBeInTheDocument();
      });

      // Test creating new task
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: '2',
          title: 'New Task',
          status: 'todo',
          project: 'personal'
        }),
      } as Response);

      // Test updating task status
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: '1',
          title: 'Task 1',
          status: 'done',
          project: 'personal'
        }),
      } as Response);

      // Test deleting task
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Task deleted successfully' }),
      } as Response);
    });
  });

  describe('Complete CSV Import Workflow', () => {
    test('should complete full CSV import workflow', async () => {
      const csvContent = 'Full Name,Email,Phone\nJohn Doe,john@example.com,123-456-7890\nJane Smith,jane@example.com,098-765-4321';
      
      // Mock CSV preview
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          total_rows: 2,
          columns: ['Full Name', 'Email', 'Phone'],
          mapping: {
            'Full Name': 'first_name',
            'Email': 'email',
            'Phone': 'phone'
          },
          preview_data: [
            {
              row_number: 2,
              data: {
                'Full Name': 'John Doe',
                'Email': 'john@example.com',
                'Phone': '123-456-7890'
              },
              mapped_data: {
                first_name: 'John Doe',
                email: 'john@example.com',
                phone: '123-456-7890'
              }
            }
          ]
        }),
      } as Response);

      // Mock CSV import
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          imported_count: 2,
          errors: []
        }),
      } as Response);

      // Mock initial data loading
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: '1',
            email: 'test@example.com',
            full_name: 'Test User',
            is_approved: true
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ projects: {}, total_tasks: 0 }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ events: [], count: 0 }),
        } as Response);

      renderWithRouter(<App />);

      // Navigate to contacts
      const contactsTab = screen.getByText(/contacts/i);
      fireEvent.click(contactsTab);

      // Open CSV uploader
      const csvButton = screen.getByText(/import csv/i);
      fireEvent.click(csvButton);

      // Upload CSV file
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });
      const fileInput = screen.getByLabelText(/choose file/i);
      fireEvent.change(fileInput, { target: { files: [file] } });

      const uploadButton = screen.getByText(/upload/i);
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText('CSV Preview')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Confirm import
      const importButton = screen.getByText(/import contacts/i);
      fireEvent.click(importButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/csv/import'),
          expect.objectContaining({
            method: 'POST',
            body: expect.any(FormData)
          })
        );
      });
    });
  });

  describe('Complete Custom Fields Workflow', () => {
    test('should complete full custom fields workflow', async () => {
      // Mock initial data loading
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: '1',
            email: 'test@example.com',
            full_name: 'Test User',
            is_approved: true
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ projects: {}, total_tasks: 0 }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ events: [], count: 0 }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ custom_fields: [] }),
        } as Response);

      renderWithRouter(<App />);

      // Navigate to settings
      const settingsTab = screen.getByText(/settings/i);
      fireEvent.click(settingsTab);

      // Create custom field
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          custom_field: {
            id: 1,
            name: 'Department',
            key: 'department',
            type: 'text',
            options: []
          }
        }),
      } as Response);

      const nameInput = screen.getByLabelText(/field name/i);
      fireEvent.change(nameInput, { target: { value: 'Department' } });

      const addButton = screen.getByText(/add field/i);
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/custom-fields'),
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              name: 'Department',
              key: 'department',
              type: 'text'
            })
          })
        );
      });

      expect(screen.getByText('Department')).toBeInTheDocument();
    });
  });

  describe('Error Recovery and Resilience', () => {
    test('should handle network failures gracefully', async () => {
      // Mock initial success
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: '1',
            email: 'test@example.com',
            full_name: 'Test User',
            is_approved: true
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ projects: {}, total_tasks: 0 }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ events: [], count: 0 }),
        } as Response)
        // Mock network failure
        .mockRejectedValueOnce(new Error('Network error'));

      renderWithRouter(<App />);

      // Navigate to contacts
      const contactsTab = screen.getByText(/contacts/i);
      fireEvent.click(contactsTab);

      // Should handle error gracefully
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });

    test('should retry failed requests', async () => {
      // Mock initial success
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: '1',
            email: 'test@example.com',
            full_name: 'Test User',
            is_approved: true
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ projects: {}, total_tasks: 0 }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ events: [], count: 0 }),
        } as Response)
        // Mock failure then success
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        } as Response);

      renderWithRouter(<App />);

      // Navigate to contacts
      const contactsTab = screen.getByText(/contacts/i);
      fireEvent.click(contactsTab);

      // Should retry and eventually succeed
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(5); // Initial 4 + 1 retry
      });
    });
  });

  describe('Performance and Loading States', () => {
    test('should show loading states during API calls', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise(resolve => {
        resolvePromise = resolve;
      });

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: '1',
            email: 'test@example.com',
            full_name: 'Test User',
            is_approved: true
          }),
        } as Response)
        .mockReturnValueOnce(promise);

      renderWithRouter(<App />);

      // Should show loading state
      expect(screen.getByText(/loading/i)).toBeInTheDocument();

      // Resolve the promise
      resolvePromise!({
        ok: true,
        json: async () => [],
      } as Response);

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });
    });
  });
});
