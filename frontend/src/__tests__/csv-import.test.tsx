/**
 * CSV Import Integration Tests
 * Tests CSV upload and preview functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';

// Mock fetch for CSV upload
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

// Mock the CSV uploader component
import CsvUploader from '../components/CsvUploader';

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('CSV Import Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('mock-jwt-token');
  });

  describe('CSV File Upload', () => {
    test('should upload CSV file successfully', async () => {
      const mockResponse = {
        success: true,
        total_rows: 3,
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
          },
          {
            row_number: 3,
            data: {
              'Full Name': 'Jane Smith',
              'Email': 'jane@example.com',
              'Phone': '098-765-4321'
            },
            mapped_data: {
              first_name: 'Jane Smith',
              email: 'jane@example.com',
              phone: '098-765-4321'
            }
          }
        ]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      renderWithRouter(<CsvUploader />);

      // Create a mock CSV file
      const csvContent = 'Full Name,Email,Phone\nJohn Doe,john@example.com,123-456-7890\nJane Smith,jane@example.com,098-765-4321';
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });

      const fileInput = screen.getByLabelText(/choose file/i);
      fireEvent.change(fileInput, { target: { files: [file] } });

      const uploadButton = screen.getByText('Upload');
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/csv/preview-simple'),
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Authorization': 'Bearer mock-jwt-token'
            }),
            body: expect.any(FormData)
          })
        );
      });

      // Should show preview modal
      expect(screen.getByText('CSV Preview')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    test('should handle CSV upload errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Invalid CSV format',
      } as Response);

      renderWithRouter(<CsvUploader />);

      const csvContent = 'Invalid,CSV,Format\n';
      const file = new File([csvContent], 'invalid.csv', { type: 'text/csv' });

      const fileInput = screen.getByLabelText(/choose file/i);
      fireEvent.change(fileInput, { target: { files: [file] } });

      const uploadButton = screen.getByText('Upload');
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });

    test('should handle network errors during upload', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      renderWithRouter(<CsvUploader />);

      const csvContent = 'Name,Email\nJohn,john@example.com';
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });

      const fileInput = screen.getByLabelText(/choose file/i);
      fireEvent.change(fileInput, { target: { files: [file] } });

      const uploadButton = screen.getByText('Upload');
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    test('should validate file type before upload', () => {
      renderWithRouter(<CsvUploader />);

      const invalidFile = new File(['content'], 'test.txt', { type: 'text/plain' });
      const fileInput = screen.getByLabelText(/choose file/i);
      
      fireEvent.change(fileInput, { target: { files: [invalidFile] } });

      expect(screen.getByText(/please select a csv file/i)).toBeInTheDocument();
    });

    test('should show file size validation', () => {
      renderWithRouter(<CsvUploader />);

      // Create a large file (>10MB)
      const largeContent = 'x'.repeat(11 * 1024 * 1024); // 11MB
      const largeFile = new File([largeContent], 'large.csv', { type: 'text/csv' });
      
      const fileInput = screen.getByLabelText(/choose file/i);
      fireEvent.change(fileInput, { target: { files: [largeFile] } });

      expect(screen.getByText(/file size must be less than 10mb/i)).toBeInTheDocument();
    });
  });

  describe('CSV Preview and Mapping', () => {
    test('should display CSV preview with correct data', async () => {
      const mockResponse = {
        success: true,
        total_rows: 2,
        columns: ['Full Name', 'Email', 'Phone', 'Company'],
        mapping: {
          'Full Name': 'first_name',
          'Email': 'email',
          'Phone': 'phone',
          'Company': 'organization'
        },
        preview_data: [
          {
            row_number: 2,
            data: {
              'Full Name': 'John Doe',
              'Email': 'john@example.com',
              'Phone': '123-456-7890',
              'Company': 'Acme Corp'
            },
            mapped_data: {
              first_name: 'John Doe',
              email: 'john@example.com',
              phone: '123-456-7890',
              organization: 'Acme Corp'
            }
          }
        ]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      renderWithRouter(<CsvUploader />);

      const csvContent = 'Full Name,Email,Phone,Company\nJohn Doe,john@example.com,123-456-7890,Acme Corp';
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });

      const fileInput = screen.getByLabelText(/choose file/i);
      fireEvent.change(fileInput, { target: { files: [file] } });

      const uploadButton = screen.getByText('Upload');
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText('CSV Preview')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
        expect(screen.getByText('123-456-7890')).toBeInTheDocument();
        expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      });
    });

    test('should allow column mapping customization', async () => {
      const mockResponse = {
        success: true,
        total_rows: 1,
        columns: ['Name', 'E-mail', 'Phone Number'],
        mapping: {
          'Name': 'first_name',
          'E-mail': 'email',
          'Phone Number': 'phone'
        },
        preview_data: [
          {
            row_number: 2,
            data: {
              'Name': 'John Doe',
              'E-mail': 'john@example.com',
              'Phone Number': '123-456-7890'
            },
            mapped_data: {
              first_name: 'John Doe',
              email: 'john@example.com',
              phone: '123-456-7890'
            }
          }
        ]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      renderWithRouter(<CsvUploader />);

      const csvContent = 'Name,E-mail,Phone Number\nJohn Doe,john@example.com,123-456-7890';
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });

      const fileInput = screen.getByLabelText(/choose file/i);
      fireEvent.change(fileInput, { target: { files: [file] } });

      const uploadButton = screen.getByText('Upload');
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText('CSV Preview')).toBeInTheDocument();
      });

      // Test column mapping dropdowns
      const nameMapping = screen.getByDisplayValue('first_name');
      expect(nameMapping).toBeInTheDocument();

      const emailMapping = screen.getByDisplayValue('email');
      expect(emailMapping).toBeInTheDocument();
    });

    test('should handle empty CSV files', async () => {
      const mockResponse = {
        success: true,
        total_rows: 0,
        columns: [],
        mapping: {},
        preview_data: []
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      renderWithRouter(<CsvUploader />);

      const csvContent = '';
      const file = new File([csvContent], 'empty.csv', { type: 'text/csv' });

      const fileInput = screen.getByLabelText(/choose file/i);
      fireEvent.change(fileInput, { target: { files: [file] } });

      const uploadButton = screen.getByText('Upload');
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText(/no data found/i)).toBeInTheDocument();
      });
    });
  });

  describe('CSV Import with Hebrew Content', () => {
    test('should handle Hebrew characters in CSV', async () => {
      const mockResponse = {
        success: true,
        total_rows: 1,
        columns: ['שם מלא', 'אימייל', 'טלפון'],
        mapping: {
          'שם מלא': 'first_name',
          'אימייל': 'email',
          'טלפון': 'phone'
        },
        preview_data: [
          {
            row_number: 2,
            data: {
              'שם מלא': 'יוחנן דו',
              'אימייל': 'yohanan@example.com',
              'טלפון': '050-123-4567'
            },
            mapped_data: {
              first_name: 'יוחנן דו',
              email: 'yohanan@example.com',
              phone: '050-123-4567'
            }
          }
        ]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      renderWithRouter(<CsvUploader />);

      // Create CSV with Hebrew content
      const csvContent = 'שם מלא,אימייל,טלפון\nיוחנן דו,yohanan@example.com,050-123-4567';
      const file = new File([csvContent], 'hebrew.csv', { type: 'text/csv' });

      const fileInput = screen.getByLabelText(/choose file/i);
      fireEvent.change(fileInput, { target: { files: [file] } });

      const uploadButton = screen.getByText('Upload');
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText('CSV Preview')).toBeInTheDocument();
        expect(screen.getByText('יוחנן דו')).toBeInTheDocument();
      });
    });
  });

  describe('CSV Import Error Handling', () => {
    test('should handle malformed CSV', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid CSV format' }),
      } as Response);

      renderWithRouter(<CsvUploader />);

      const csvContent = 'Invalid,CSV\nMissing,Quotes,Here';
      const file = new File([csvContent], 'malformed.csv', { type: 'text/csv' });

      const fileInput = screen.getByLabelText(/choose file/i);
      fireEvent.change(fileInput, { target: { files: [file] } });

      const uploadButton = screen.getByText('Upload');
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid csv format/i)).toBeInTheDocument();
      });
    });

    test('should handle server timeout', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Request timeout'));

      renderWithRouter(<CsvUploader />);

      const csvContent = 'Name,Email\nJohn,john@example.com';
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });

      const fileInput = screen.getByLabelText(/choose file/i);
      fireEvent.change(fileInput, { target: { files: [file] } });

      const uploadButton = screen.getByText('Upload');
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText(/request timeout/i)).toBeInTheDocument();
      });
    });
  });

  describe('Authentication and Authorization', () => {
    test('should include auth token in CSV upload request', async () => {
      const mockResponse = {
        success: true,
        total_rows: 0,
        columns: [],
        mapping: {},
        preview_data: []
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      renderWithRouter(<CsvUploader />);

      const csvContent = 'Name,Email\nJohn,john@example.com';
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });

      const fileInput = screen.getByLabelText(/choose file/i);
      fireEvent.change(fileInput, { target: { files: [file] } });

      const uploadButton = screen.getByText('Upload');
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: expect.objectContaining({
              'Authorization': 'Bearer mock-jwt-token'
            })
          })
        );
      });
    });

    test('should handle 401 unauthorized error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      } as Response);

      renderWithRouter(<CsvUploader />);

      const csvContent = 'Name,Email\nJohn,john@example.com';
      const file = new File([csvContent], 'test.csv', { type: 'text/csv' });

      const fileInput = screen.getByLabelText(/choose file/i);
      fireEvent.change(fileInput, { target: { files: [file] } });

      const uploadButton = screen.getByText('Upload');
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText(/unauthorized/i)).toBeInTheDocument();
      });
    });
  });
});
