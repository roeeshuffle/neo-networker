# Bot Integration KPIs Definition

## Overview
This document defines the Key Performance Indicators (KPIs) for the Telegram bot integration, specifying the required fields for each function to work with the existing backend implementation.

## Function Mapping
- **Function 14**: Search contacts (by fields)
- **Function 10**: Insert contact (dynamic fields)
- **Function 2**: Show open tasks
- **Function 4**: Update task to done
- **Function 6**: Create event
- **Function 9**: Update event
- **Function 7**: Show events (today/tomorrow/this week)

---

## 1. Search Contact (Function 14)

### Purpose
Search for contacts/people by various fields

### Required Fields
```json
{
  "query": "string",        // REQUIRED - Search term (name, email, company, etc.)
  "type": "string"          // REQUIRED - Search type: "people", "companies", "tasks"
}
```

### Optional Fields
- None

### Examples
```json
// Search by name
{"query": "John", "type": "people"}

// Search by company
{"query": "Microsoft", "type": "companies"}

// Search all contacts
{"query": "all contacts", "type": "people"}
```

### Response Format
- Returns formatted contact information with name, email, company, status, categories, LinkedIn, etc.

---

## 2. Insert Contact (Function 10)

### Purpose
Add new contacts with dynamic fields (not all fields required)

### Required Fields
```json
{
  "full_name": "string"     // REQUIRED - Contact's full name
}
```

### Optional Fields
```json
{
  "email": "string",
  "phone": "string",
  "company": "string",
  "status": "string",
  "categories": "string",
  "linkedin_profile": "string",
  "newsletter": "boolean",
  "should_avishag_meet": "boolean",
  "more_info": "string",
  "last_email_interaction": "string",    // Format: "YYYY-MM-DD HH:MM"
  "next_due_task": "string"             // Format: "YYYY-MM-DD HH:MM"
}
```

### Examples
```json
// Minimal contact
{"full_name": "John Doe"}

// Full contact
{
  "full_name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "+1234567890",
  "company": "Tech Corp",
  "status": "Active",
  "categories": "Client",
  "linkedin_profile": "https://linkedin.com/in/janesmith",
  "newsletter": true,
  "should_avishag_meet": false,
  "more_info": "Important client",
  "last_email_interaction": "2024-01-15 10:30",
  "next_due_task": "2024-01-20 14:00"
}
```

---

## 3. Show Open Tasks (Function 2)

### Purpose
Display open/active tasks for the user

### Required Fields
```json
{
  "status": "string"        // REQUIRED - Task status filter: "todo", "in_progress", "done", "all"
}
```

### Optional Fields
```json
{
  "project": "string",      // Filter by project
  "priority": "string",     // Filter by priority: "low", "medium", "high"
  "limit": "integer"        // Number of tasks to show (default: 10)
}
```

### Examples
```json
// Show all open tasks
{"status": "todo"}

// Show high priority tasks
{"status": "todo", "priority": "high"}

// Show tasks from specific project
{"status": "todo", "project": "Project Alpha"}
```

---

## 4. Update Task to Done (Function 4)

### Purpose
Mark a task as completed

### Required Fields
```json
{
  "task_id": "integer",    // REQUIRED - Task ID to update
  "updates": {
    "status": "done"        // REQUIRED - Set status to "done"
  }
}
```

### Optional Fields
```json
{
  "updates": {
    "title": "string",
    "description": "string",
    "project": "string",
    "priority": "string",
    "assign_to": "string",
    "label": "string",
    "notes": "string",
    "is_scheduled": "boolean",
    "is_active": "boolean",
    "due_date": "string",           // Format: "YYYY-MM-DD HH:MM"
    "scheduled_date": "string",      // Format: "YYYY-MM-DD HH:MM"
    "alert_time": "string"          // Format: "YYYY-MM-DD HH:MM"
  }
}
```

### Examples
```json
// Simple task completion
{
  "task_id": 123,
  "updates": {"status": "done"}
}

// Complete task with notes
{
  "task_id": 123,
  "updates": {
    "status": "done",
    "notes": "Task completed successfully"
  }
}
```

---

## 5. Create Event (Function 6)

### Purpose
Create a new calendar event

### Required Fields
```json
{
  "title": "string",        // REQUIRED - Event title
  "start_datetime": "string" // REQUIRED - Format: "YYYY-MM-DD HH:MM"
}
```

### Optional Fields
```json
{
  "end_datetime": "string",    // Format: "YYYY-MM-DD HH:MM" (defaults to start + 1 hour)
  "description": "string",
  "location": "string",
  "event_type": "string",
  "participants": "array",     // Array of participant objects
  "alert": "integer"           // Alert minutes before event (default: 15)
}
```

### Examples
```json
// Simple event
{
  "title": "Team Meeting",
  "start_datetime": "2024-01-20 14:00"
}

// Full event
{
  "title": "Client Presentation",
  "start_datetime": "2024-01-20 14:00",
  "end_datetime": "2024-01-20 15:30",
  "description": "Present quarterly results to client",
  "location": "Conference Room A",
  "event_type": "meeting",
  "participants": [
    {"email": "client@example.com", "name": "Client Name"}
  ],
  "alert": 30
}
```

---

## 6. Update Event (Function 9)

### Purpose
Update an existing calendar event

### Required Fields
```json
{
  "event_id": "string",     // REQUIRED - Event ID to update
  "updates": "object"       // REQUIRED - Fields to update
}
```

### Optional Fields (in updates object)
```json
{
  "title": "string",
  "start_datetime": "string",    // Format: "YYYY-MM-DD HH:MM"
  "end_datetime": "string",      // Format: "YYYY-MM-DD HH:MM"
  "description": "string",
  "location": "string",
  "event_type": "string",
  "participants": "array",
  "alert": "integer"
}
```

### Examples
```json
// Update event time
{
  "event_id": "event-123",
  "updates": {
    "start_datetime": "2024-01-20 15:00",
    "end_datetime": "2024-01-20 16:00"
  }
}

// Update event details
{
  "event_id": "event-123",
  "updates": {
    "title": "Updated Meeting Title",
    "description": "Updated description",
    "location": "New Location"
  }
}
```

---

## 7. Show Events (Function 7)

### Purpose
Display events for specific time periods

### Required Fields
```json
{
  "period": "string"        // REQUIRED - Time period: "today", "tomorrow", "weekly", "monthly", "all"
}
```

### Optional Fields
```json
{
  "start_date": "string",   // Format: "YYYY-MM-DD HH:MM" (overrides period)
  "end_date": "string",     // Format: "YYYY-MM-DD HH:MM" (overrides period)
  "filter": "object"        // Additional filters
}
```

### Examples
```json
// Show today's events
{"period": "today"}

// Show this week's events
{"period": "weekly"}

// Show custom date range
{
  "start_date": "2024-01-20 00:00",
  "end_date": "2024-01-21 23:59"
}

// Show tomorrow's events
{"period": "tomorrow"}
```

---

## Implementation Notes

### Date Formats
- All datetime fields use format: `"YYYY-MM-DD HH:MM"`
- Alternative ISO format is also supported: `"2024-01-20T14:00:00"`

### Error Handling
- All functions return user-friendly error messages
- Missing required fields will cause function failure
- Invalid date formats will return specific error messages

### User Authentication
- All functions require the user to be connected via Telegram ID
- Functions automatically find the associated user account

### Response Format
- All functions return formatted text responses suitable for Telegram
- Success messages include relevant details
- Error messages are user-friendly and actionable

---

## Testing Examples

### Complete Workflow Example
1. **Search Contact**: `{"query": "John", "type": "people"}`
2. **Add Contact**: `{"full_name": "John Doe", "email": "john@example.com"}`
3. **Show Tasks**: `{"status": "todo"}`
4. **Complete Task**: `{"task_id": 123, "updates": {"status": "done"}}`
5. **Create Event**: `{"title": "Meeting", "start_datetime": "2024-01-20 14:00"}`
6. **Show Events**: `{"period": "today"}`

This KPI definition ensures the bot can effectively interact with all major features of the Neo Networker system while maintaining data integrity and user experience.
