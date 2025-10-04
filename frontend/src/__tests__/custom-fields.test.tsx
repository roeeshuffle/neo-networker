/**
 * Custom Fields Integration Tests
 * Tests custom fields functionality with backend API
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';

// Mock fetch for custom fields API
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

// Mock the custom fields components
import CustomFieldsSettings from '../components/CustomFieldsSettings';
import ContactViewModal from '../components/ContactViewModal';

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Custom Fields Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('mock-jwt-token');
  });

  describe('Custom Fields Management', () => {
    const mockCustomFields = [
      {
        id: 1,
        name: 'Department',
        key: 'department',
        type: 'text',
        options: [],
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 2,
        name: 'Priority Level',
        key: 'priority_level',
        type: 'select',
        options: ['Low', 'Medium', 'High'],
        created_at: '2024-01-01T00:00:00Z'
      }
    ];

    test('should load existing custom fields', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          custom_fields: mockCustomFields
        }),
      } as Response);

      renderWithRouter(<CustomFieldsSettings />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/custom-fields'),
          expect.objectContaining({
            method: 'GET',
            headers: expect.objectContaining({
              'Authorization': 'Bearer mock-jwt-token'
            })
          })
        );
      });

      expect(screen.getByText('Department')).toBeInTheDocument();
      expect(screen.getByText('Priority Level')).toBeInTheDocument();
    });

    test('should create new custom field', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ custom_fields: [] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            custom_field: {
              id: 3,
              name: 'New Field',
              key: 'new_field',
              type: 'text',
              options: [],
              created_at: '2024-01-01T00:00:00Z'
            }
          }),
        } as Response);

      renderWithRouter(<CustomFieldsSettings />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      // Fill in the form
      const nameInput = screen.getByLabelText(/field name/i);
      fireEvent.change(nameInput, { target: { value: 'New Field' } });

      const typeSelect = screen.getByLabelText(/field type/i);
      fireEvent.change(typeSelect, { target: { value: 'text' } });

      const addButton = screen.getByText('Add Field');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/custom-fields'),
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Authorization': 'Bearer mock-jwt-token',
              'Content-Type': 'application/json'
            }),
            body: JSON.stringify({
              name: 'New Field',
              key: 'new_field',
              type: 'text'
            })
          })
        );
      });

      expect(screen.getByText('New Field')).toBeInTheDocument();
    });

    test('should create select field with options', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ custom_fields: [] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            custom_field: {
              id: 4,
              name: 'Status',
              key: 'status',
              type: 'select',
              options: ['Active', 'Inactive', 'Pending'],
              created_at: '2024-01-01T00:00:00Z'
            }
          }),
        } as Response);

      renderWithRouter(<CustomFieldsSettings />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      // Fill in the form for select field
      const nameInput = screen.getByLabelText(/field name/i);
      fireEvent.change(nameInput, { target: { value: 'Status' } });

      const typeSelect = screen.getByLabelText(/field type/i);
      fireEvent.change(typeSelect, { target: { value: 'select' } });

      // Add options
      const optionsInput = screen.getByLabelText(/options/i);
      fireEvent.change(optionsInput, { target: { value: 'Active,Inactive,Pending' } });

      const addButton = screen.getByText('Add Field');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/custom-fields'),
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              name: 'Status',
              key: 'status',
              type: 'select',
              options: ['Active', 'Inactive', 'Pending']
            })
          })
        );
      });
    });

    test('should handle custom field creation errors', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ custom_fields: [] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({ error: 'Field name already exists' }),
        } as Response);

      renderWithRouter(<CustomFieldsSettings />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      const nameInput = screen.getByLabelText(/field name/i);
      fireEvent.change(nameInput, { target: { value: 'Duplicate Field' } });

      const addButton = screen.getByText('Add Field');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/field name already exists/i)).toBeInTheDocument();
      });
    });
  });

  describe('Custom Fields in Contact Forms', () => {
    const mockPerson = {
      id: '1',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      custom_fields: {
        department: 'Engineering',
        priority_level: 'High'
      }
    };

    const mockCustomFieldDefinitions = [
      {
        id: 1,
        name: 'Department',
        key: 'department',
        type: 'text',
        options: []
      },
      {
        id: 2,
        name: 'Priority Level',
        key: 'priority_level',
        type: 'select',
        options: ['Low', 'Medium', 'High']
      }
    ];

    test('should display custom fields in contact view modal', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ custom_fields: mockCustomFieldDefinitions }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        } as Response);

      const mockOnSave = jest.fn();
      const mockOnClose = jest.fn();

      renderWithRouter(
        <ContactViewModal
          isOpen={true}
          onClose={mockOnClose}
          person={mockPerson}
          onSave={mockOnSave}
          isEditing={true}
        />
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/custom-fields'),
          expect.objectContaining({
            method: 'GET',
            headers: expect.objectContaining({
              'Authorization': 'Bearer mock-jwt-token'
            })
          })
        );
      });

      // Should show custom fields tab
      expect(screen.getByText('Custom Fields')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Engineering')).toBeInTheDocument();
      expect(screen.getByDisplayValue('High')).toBeInTheDocument();
    });

    test('should add new custom field in contact form', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ custom_fields: [] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            custom_field: {
              id: 3,
              name: 'New Field',
              key: 'new_field',
              type: 'text',
              options: []
            }
          }),
        } as Response);

      const mockOnSave = jest.fn();
      const mockOnClose = jest.fn();

      renderWithRouter(
        <ContactViewModal
          isOpen={true}
          onClose={mockOnClose}
          person={mockPerson}
          onSave={mockOnSave}
          isEditing={true}
        />
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      // Add new custom field
      const newFieldNameInput = screen.getByPlaceholderText(/enter field name/i);
      fireEvent.change(newFieldNameInput, { target: { value: 'New Field' } });

      const addFieldButton = screen.getByText('Add Field');
      fireEvent.click(addFieldButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/custom-fields'),
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              name: 'New Field',
              key: 'new_field',
              type: 'text'
            })
          })
        );
      });

      expect(screen.getByText('New Field')).toBeInTheDocument();
    });

    test('should save custom field values when saving contact', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ custom_fields: mockCustomFieldDefinitions }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        } as Response);

      const mockOnSave = jest.fn();
      const mockOnClose = jest.fn();

      renderWithRouter(
        <ContactViewModal
          isOpen={true}
          onClose={mockOnClose}
          person={mockPerson}
          onSave={mockOnSave}
          isEditing={true}
        />
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      // Modify custom field value
      const departmentInput = screen.getByDisplayValue('Engineering');
      fireEvent.change(departmentInput, { target: { value: 'Marketing' } });

      // Save contact
      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          custom_fields: expect.objectContaining({
            department: 'Marketing',
            priority_level: 'High'
          })
        })
      );
    });

    test('should handle custom fields API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal server error',
      } as Response);

      const mockOnSave = jest.fn();
      const mockOnClose = jest.fn();

      renderWithRouter(
        <ContactViewModal
          isOpen={true}
          onClose={mockOnClose}
          person={mockPerson}
          onSave={mockOnSave}
          isEditing={true}
        />
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      // Should still show the form even if custom fields fail to load
      expect(screen.getByText('General Info')).toBeInTheDocument();
    });
  });

  describe('Custom Fields Validation', () => {
    test('should validate required field names', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ custom_fields: [] }),
      } as Response);

      renderWithRouter(<CustomFieldsSettings />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      const addButton = screen.getByText('Add Field');
      fireEvent.click(addButton);

      expect(screen.getByText(/field name is required/i)).toBeInTheDocument();
    });

    test('should validate field name format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ custom_fields: [] }),
      } as Response);

      renderWithRouter(<CustomFieldsSettings />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      const nameInput = screen.getByLabelText(/field name/i);
      fireEvent.change(nameInput, { target: { value: 'Invalid Field Name!' } });

      const addButton = screen.getByText('Add Field');
      fireEvent.click(addButton);

      expect(screen.getByText(/field name can only contain letters, numbers, and spaces/i)).toBeInTheDocument();
    });

    test('should validate select field options', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ custom_fields: [] }),
      } as Response);

      renderWithRouter(<CustomFieldsSettings />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      const nameInput = screen.getByLabelText(/field name/i);
      fireEvent.change(nameInput, { target: { value: 'Status' } });

      const typeSelect = screen.getByLabelText(/field type/i);
      fireEvent.change(typeSelect, { target: { value: 'select' } });

      const addButton = screen.getByText('Add Field');
      fireEvent.click(addButton);

      expect(screen.getByText(/options are required for select fields/i)).toBeInTheDocument();
    });
  });

  describe('Custom Fields Persistence', () => {
    test('should persist custom field definitions across sessions', async () => {
      const mockCustomFields = [
        {
          id: 1,
          name: 'Department',
          key: 'department',
          type: 'text',
          options: []
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ custom_fields: mockCustomFields }),
      } as Response);

      renderWithRouter(<CustomFieldsSettings />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      expect(screen.getByText('Department')).toBeInTheDocument();

      // Refresh the component
      renderWithRouter(<CustomFieldsSettings />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });

      expect(screen.getByText('Department')).toBeInTheDocument();
    });
  });
});
