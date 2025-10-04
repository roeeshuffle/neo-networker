/**
 * Component Integration Tests
 * Tests React components with backend API integration
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';

// Mock the API client
jest.mock('../integrations/api/client', () => ({
  apiClient: {
    getPeople: jest.fn(),
    createPerson: jest.fn(),
    updatePerson: jest.fn(),
    deletePerson: jest.fn(),
    getTasks: jest.fn(),
    createTask: jest.fn(),
    updateTask: jest.fn(),
    deleteTask: jest.fn(),
    getEvents: jest.fn(),
    createEvent: jest.fn(),
    updateEvent: jest.fn(),
    deleteEvent: jest.fn(),
    getProjects: jest.fn(),
    login: jest.fn(),
    getCurrentUser: jest.fn(),
    isAuthenticated: jest.fn(() => true),
  }
}));

// Mock components that might have complex dependencies
jest.mock('../components/ContactViewModal', () => {
  return function MockContactViewModal({ isOpen, onClose, person, onSave }: any) {
    return isOpen ? (
      <div data-testid="contact-view-modal">
        <h2>Contact Details</h2>
        <p>Name: {person?.first_name} {person?.last_name}</p>
        <button onClick={() => onSave({ ...person, first_name: 'Updated' })}>
          Save
        </button>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null;
  };
});

jest.mock('../components/DynamicContactForm', () => {
  return function MockDynamicContactForm({ isOpen, onClose, onSave }: any) {
    return isOpen ? (
      <div data-testid="contact-form-modal">
        <h2>Add New Contact</h2>
        <button onClick={() => onSave({ first_name: 'New', last_name: 'Contact' })}>
          Save
        </button>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null;
  };
});

// Import components after mocking
import { apiClient } from '../integrations/api/client';
import ContactsPage from '../pages/ContactsPage';
import TasksPage from '../pages/TasksPage';
import EventsPage from '../pages/EventsPage';

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

// Helper function to render with router
const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Component Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ContactsPage Integration', () => {
    const mockPeople = [
      {
        id: '1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '123-456-7890',
        organization: 'Acme Corp'
      },
      {
        id: '2',
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@example.com',
        phone: '098-765-4321',
        organization: 'Tech Inc'
      }
    ];

    test('should load and display people on mount', async () => {
      mockApiClient.getPeople.mockResolvedValue({
        data: mockPeople,
        error: null
      });

      renderWithRouter(<ContactsPage />);

      await waitFor(() => {
        expect(mockApiClient.getPeople).toHaveBeenCalled();
      });

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    test('should handle API errors gracefully', async () => {
      mockApiClient.getPeople.mockResolvedValue({
        data: null,
        error: { message: 'Failed to fetch people' }
      });

      renderWithRouter(<ContactsPage />);

      await waitFor(() => {
        expect(mockApiClient.getPeople).toHaveBeenCalled();
      });

      // Should show error state or empty state
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });

    test('should open contact form when add button is clicked', async () => {
      mockApiClient.getPeople.mockResolvedValue({
        data: [],
        error: null
      });

      renderWithRouter(<ContactsPage />);

      await waitFor(() => {
        expect(mockApiClient.getPeople).toHaveBeenCalled();
      });

      const addButton = screen.getByText('Add Contact');
      fireEvent.click(addButton);

      expect(screen.getByTestId('contact-form-modal')).toBeInTheDocument();
    });

    test('should create new contact when form is submitted', async () => {
      mockApiClient.getPeople.mockResolvedValue({
        data: [],
        error: null
      });
      mockApiClient.createPerson.mockResolvedValue({
        data: { id: '3', first_name: 'New', last_name: 'Contact' },
        error: null
      });

      renderWithRouter(<ContactsPage />);

      await waitFor(() => {
        expect(mockApiClient.getPeople).toHaveBeenCalled();
      });

      const addButton = screen.getByText('Add Contact');
      fireEvent.click(addButton);

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockApiClient.createPerson).toHaveBeenCalledWith({
          first_name: 'New',
          last_name: 'Contact'
        });
      });
    });
  });

  describe('TasksPage Integration', () => {
    const mockTasksData = {
      projects: {
        'personal': [
          {
            id: '1',
            title: 'Task 1',
            description: 'Description 1',
            status: 'todo',
            project: 'personal',
            due_date: null
          }
        ],
        'work': [
          {
            id: '2',
            title: 'Task 2',
            description: 'Description 2',
            status: 'in_progress',
            project: 'work',
            due_date: '2024-01-15'
          }
        ]
      },
      total_tasks: 2
    };

    test('should load and display tasks on mount', async () => {
      mockApiClient.getTasks.mockResolvedValue({
        data: mockTasksData,
        error: null
      });
      mockApiClient.getProjects.mockResolvedValue({
        data: ['personal', 'work'],
        error: null
      });

      renderWithRouter(<TasksPage />);

      await waitFor(() => {
        expect(mockApiClient.getTasks).toHaveBeenCalled();
        expect(mockApiClient.getProjects).toHaveBeenCalled();
      });

      expect(screen.getByText('Task 1')).toBeInTheDocument();
      expect(screen.getByText('Task 2')).toBeInTheDocument();
    });

    test('should filter tasks by project', async () => {
      mockApiClient.getTasks.mockResolvedValue({
        data: mockTasksData,
        error: null
      });
      mockApiClient.getProjects.mockResolvedValue({
        data: ['personal', 'work'],
        error: null
      });

      renderWithRouter(<TasksPage />);

      await waitFor(() => {
        expect(mockApiClient.getTasks).toHaveBeenCalled();
      });

      // Test project filter
      const projectFilter = screen.getByRole('combobox', { name: /project/i });
      fireEvent.change(projectFilter, { target: { value: 'personal' } });

      await waitFor(() => {
        expect(mockApiClient.getTasks).toHaveBeenCalledWith('personal', null, true);
      });
    });

    test('should create new task', async () => {
      mockApiClient.getTasks.mockResolvedValue({
        data: { projects: {}, total_tasks: 0 },
        error: null
      });
      mockApiClient.getProjects.mockResolvedValue({
        data: [],
        error: null
      });
      mockApiClient.createTask.mockResolvedValue({
        data: { id: '3', title: 'New Task', status: 'todo' },
        error: null
      });

      renderWithRouter(<TasksPage />);

      await waitFor(() => {
        expect(mockApiClient.getTasks).toHaveBeenCalled();
      });

      const addButton = screen.getByText('Add Task');
      fireEvent.click(addButton);

      // This would open a task form - in real implementation
      // we'd test the form submission
    });
  });

  describe('EventsPage Integration', () => {
    const mockEventsData = {
      events: [
        {
          id: '1',
          title: 'Meeting',
          description: 'Team meeting',
          start_datetime: '2024-01-01T10:00:00Z',
          end_datetime: '2024-01-01T11:00:00Z',
          location: 'Conference Room A'
        }
      ],
      count: 1
    };

    test('should load and display events on mount', async () => {
      mockApiClient.getEvents.mockResolvedValue({
        data: mockEventsData,
        error: null
      });

      renderWithRouter(<EventsPage />);

      await waitFor(() => {
        expect(mockApiClient.getEvents).toHaveBeenCalled();
      });

      expect(screen.getByText('Meeting')).toBeInTheDocument();
    });

    test('should filter events by date range', async () => {
      mockApiClient.getEvents.mockResolvedValue({
        data: mockEventsData,
        error: null
      });

      renderWithRouter(<EventsPage />);

      await waitFor(() => {
        expect(mockApiClient.getEvents).toHaveBeenCalled();
      });

      // Test date range filter
      const startDateInput = screen.getByLabelText(/start date/i);
      const endDateInput = screen.getByLabelText(/end date/i);

      fireEvent.change(startDateInput, { target: { value: '2024-01-01' } });
      fireEvent.change(endDateInput, { target: { value: '2024-01-31' } });

      await waitFor(() => {
        expect(mockApiClient.getEvents).toHaveBeenCalledWith('2024-01-01', '2024-01-31');
      });
    });
  });

  describe('Error Handling in Components', () => {
    test('should show error message when API fails', async () => {
      mockApiClient.getPeople.mockResolvedValue({
        data: null,
        error: { message: 'Network error' }
      });

      renderWithRouter(<ContactsPage />);

      await waitFor(() => {
        expect(mockApiClient.getPeople).toHaveBeenCalled();
      });

      // Should show error state
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });

    test('should retry on failed requests', async () => {
      mockApiClient.getPeople
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          data: [],
          error: null
        });

      renderWithRouter(<ContactsPage />);

      await waitFor(() => {
        expect(mockApiClient.getPeople).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Loading States', () => {
    test('should show loading indicator while fetching data', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      mockApiClient.getPeople.mockReturnValue(promise);

      renderWithRouter(<ContactsPage />);

      expect(screen.getByText(/loading/i)).toBeInTheDocument();

      resolvePromise!({ data: [], error: null });

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });
    });
  });
});
