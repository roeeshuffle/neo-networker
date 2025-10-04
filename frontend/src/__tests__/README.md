# Frontend Test Suite

This directory contains comprehensive tests for the frontend application, covering API integration, component behavior, and end-to-end workflows.

## Test Structure

### API Tests (`api.test.ts`)
Tests the API client integration with backend endpoints:
- Authentication (login, register, getCurrentUser)
- People management (CRUD operations)
- Tasks management (CRUD operations, project filtering)
- Events management (CRUD operations, date filtering)
- CSV import functionality
- Error handling and network failures

### Component Tests (`components.test.tsx`)
Tests React components with mocked API calls:
- ContactsPage integration
- TasksPage integration
- EventsPage integration
- Error handling in components
- Loading states
- User interactions

### CSV Import Tests (`csv-import.test.tsx`)
Tests CSV upload and preview functionality:
- File upload validation
- CSV preview display
- Column mapping
- Hebrew content support
- Error handling
- Authentication integration

### Custom Fields Tests (`custom-fields.test.tsx`)
Tests custom fields functionality:
- Custom field creation and management
- Integration with contact forms
- Field validation
- Persistence across sessions
- API error handling

### End-to-End Tests (`e2e.test.tsx`)
Tests complete user workflows:
- Registration and login flow
- Complete contact management workflow
- Complete task management workflow
- Complete CSV import workflow
- Complete custom fields workflow
- Error recovery and resilience
- Performance and loading states

## Running Tests

### Install Dependencies
```bash
npm install
```

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Tests for CI
```bash
npm run test:ci
```

## Test Configuration

### Jest Configuration (`jest.config.js`)
- Uses `ts-jest` for TypeScript support
- `jsdom` environment for DOM testing
- Custom setup file for global mocks
- Coverage thresholds: 70% for all metrics
- 10-second timeout for async operations

### Test Setup (`setup.ts`)
- Global mocks for browser APIs
- Mock implementations for fetch, localStorage, etc.
- Console warning suppression
- File and URL mocking

## Test Coverage

The test suite covers:
- **API Integration**: All backend endpoints and error scenarios
- **Component Behavior**: User interactions and state management
- **Error Handling**: Network failures, validation errors, server errors
- **Authentication**: Login, logout, token management
- **Data Management**: CRUD operations for all entities
- **File Operations**: CSV upload, preview, and import
- **Custom Fields**: Dynamic field creation and management
- **Internationalization**: Hebrew content support
- **Performance**: Loading states and async operations

## Mock Strategy

### API Mocks
- Uses `jest.fn()` to mock `fetch` calls
- Simulates real API responses and errors
- Tests both success and failure scenarios

### Component Mocks
- Mocks complex components with simple implementations
- Focuses on integration rather than unit testing
- Tests user interactions and data flow

### Browser API Mocks
- Mocks localStorage, sessionStorage
- Mocks FileReader, URL.createObjectURL
- Mocks IntersectionObserver, ResizeObserver
- Mocks crypto.randomUUID

## Best Practices

### Test Organization
- Group related tests in describe blocks
- Use descriptive test names
- Test both happy path and error scenarios
- Clean up after each test

### Mock Management
- Reset mocks between tests
- Use realistic mock data
- Test both success and failure cases
- Verify mock calls with appropriate assertions

### Async Testing
- Use `waitFor` for async operations
- Test loading states
- Test error recovery
- Use appropriate timeouts

## Integration with Backend

The tests are designed to work with the actual backend API structure:

### Authentication Endpoints
- `/api/auth/register` - User registration
- `/api/auth/login` - User login
- `/api/auth/me` - Get current user

### Data Management Endpoints
- `/api/people` - People CRUD operations
- `/api/tasks` - Tasks CRUD operations
- `/api/events` - Events CRUD operations
- `/api/projects` - Get distinct projects

### Specialized Endpoints
- `/api/csv/preview-simple` - CSV preview
- `/api/custom-fields` - Custom fields management
- `/api/user-preferences` - User preferences

## Continuous Integration

The test suite is designed to run in CI environments:
- Uses `test:ci` script for non-interactive mode
- Includes coverage reporting
- Fails on coverage threshold violations
- Runs all tests without watch mode

## Debugging Tests

### Common Issues
1. **Mock not working**: Check if mocks are properly reset between tests
2. **Async operations**: Use `waitFor` instead of `setTimeout`
3. **Component not rendering**: Check if all required props are provided
4. **API calls not mocked**: Verify fetch mock is set up correctly

### Debug Commands
```bash
# Run specific test file
npm test -- api.test.ts

# Run tests with verbose output
npm test -- --verbose

# Run tests matching pattern
npm test -- --testNamePattern="should create new contact"
```

## Future Enhancements

- Add visual regression tests
- Add performance testing
- Add accessibility testing
- Add mobile device testing
- Add internationalization testing
- Add offline functionality testing
