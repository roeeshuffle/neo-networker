# Name Resolution Service Test Examples

## How It Works

The bot now intelligently resolves names to emails from your group members when you use natural language commands.

### Examples:

**Task Assignment:**
- Input: `"Add task call John tomorrow"`
- Bot resolves: "John" → "john@example.com" (if John is in your group)
- Result: Task assigned to john@example.com

**Event Participants:**
- Input: `"Schedule meeting with Sarah and Mike tomorrow 2pm"`
- Bot resolves: "Sarah" → "sarah@company.com", "Mike" → "mike@company.com"
- Result: Event created with both participants

### Error Handling:

**Multiple Matches:**
- Input: `"Assign task to John"`
- If multiple Johns in group: "Multiple users found with name 'John': John Smith (john.smith@email.com), John Doe (john.doe@email.com). Please be more specific."

**No Match:**
- Input: `"Assign task to Unknown"`
- Response: "No user found with name 'Unknown' in your group. Available group members: John Smith (john@email.com), Sarah Wilson (sarah@email.com)"

**Not in Group:**
- Input: `"Assign task to outsider@email.com"`
- Response: "User outsider@email.com is not in your group. Available group members: ..."

### Smart Resolution:

1. **Exact Match**: "John Smith" → john.smith@email.com
2. **Partial Match**: "John" → john.smith@email.com (if only one John)
3. **Email Already**: "john@email.com" → validates it's in group
4. **Multiple Johns**: Shows all options for user to choose

### Supported Commands:

- `"Add task call John tomorrow"`
- `"Assign task 123 to Sarah"`
- `"Schedule meeting with Mike and Lisa"`
- `"Update event 456 add John as participant"`

The system automatically handles name resolution behind the scenes, making the bot much more user-friendly!
