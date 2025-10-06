# CSV Import Debug Guide

## Current Status ✅
The CSV import functionality is **WORKING CORRECTLY** in the local environment.

## What Was Fixed
1. ✅ **Enabled CSV Simple Mapping Blueprint** - The `/api/csv/import-with-mapping` endpoint was disabled
2. ✅ **Added Detailed Error Logging** - Comprehensive logging for debugging CSV import issues
3. ✅ **Tested CSV Import** - Successfully imported test contacts

## Test Results
```bash
# Test CSV Import (WORKING)
curl -X POST http://localhost:5002/api/csv/import-with-mapping \
  -H "Authorization: Bearer [TOKEN]" \
  -F "file=@test_contacts.csv" \
  -F "mapping={\"Name\":\"first_name\",\"Email\":\"email\",\"Phone\":\"phone\"}"

# Response: ✅ SUCCESS
{
  "errors": [],
  "imported_count": 2,
  "success": true,
  "total_rows": 2
}
```

## Available CSV Import Endpoints

### 1. CSV Preview (Simple)
- **Endpoint**: `/api/csv/preview-simple`
- **Method**: POST
- **Purpose**: Preview CSV columns and auto-mapping
- **Status**: ✅ Working

### 2. CSV Import (Simple Mapping)
- **Endpoint**: `/api/csv/import-with-mapping`
- **Method**: POST
- **Purpose**: Import CSV with column mapping
- **Status**: ✅ Working

### 3. CSV Preview (Legacy)
- **Endpoint**: `/api/csv/preview`
- **Method**: POST
- **Purpose**: Legacy CSV preview with warnings
- **Status**: ✅ Working

### 4. CSV Processor (Legacy)
- **Endpoint**: `/api/csv-processor`
- **Method**: POST
- **Purpose**: Legacy CSV processing
- **Status**: ✅ Working

## Frontend CSV Components

### 1. SimpleCsvUploader.tsx
- **Uses**: `/api/csv/import-with-mapping`
- **Status**: ✅ Should work now

### 2. CsvUploader.tsx
- **Uses**: `/api/csv-processor`
- **Status**: ✅ Working

### 3. SimpleColumnViewer.tsx
- **Uses**: Individual `/api/people` POST requests
- **Status**: ✅ Working

## Debugging "Failed to Fetch" Errors

### Step 1: Check Network Tab
1. Open browser Developer Tools (F12)
2. Go to Network tab
3. Try CSV import
4. Look for failed requests (red entries)
5. Check the exact error message

### Step 2: Check Console Logs
1. Go to Console tab
2. Look for JavaScript errors
3. Check for CORS errors
4. Look for authentication errors

### Step 3: Check Backend Logs
```bash
# View real-time logs
docker logs neo_networker_backend_local -f

# View recent logs
docker logs neo_networker_backend_local --tail 100
```

### Step 4: Test API Directly
```bash
# Test CSV preview
curl -X POST http://localhost:5002/api/csv/preview-simple \
  -H "Authorization: Bearer [YOUR_TOKEN]" \
  -F "file=@your_file.csv"

# Test CSV import
curl -X POST http://localhost:5002/api/csv/import-with-mapping \
  -H "Authorization: Bearer [YOUR_TOKEN]" \
  -F "file=@your_file.csv" \
  -F "mapping={\"Name\":\"first_name\",\"Email\":\"email\"}"
```

## Common Issues & Solutions

### 1. "Failed to Fetch" - Network Error
- **Cause**: CORS, authentication, or endpoint not found
- **Solution**: Check if backend is running and accessible

### 2. "Unauthorized" Error
- **Cause**: Invalid or expired JWT token
- **Solution**: Re-login to get fresh token

### 3. "No file provided" Error
- **Cause**: Frontend not sending file correctly
- **Solution**: Check FormData construction

### 4. "Invalid mapping JSON" Error
- **Cause**: Malformed mapping data
- **Solution**: Check JSON format in mapping

## Test CSV File Format
```csv
Name,Email,Phone
John Doe,john@example.com,123-456-7890
Jane Smith,jane@example.com,098-765-4321
```

## Expected Mapping
```json
{
  "Name": "first_name",
  "Email": "email", 
  "Phone": "phone"
}
```

## Next Steps
1. **Test in Frontend**: Try CSV import through the web interface
2. **Check Logs**: Monitor backend logs for detailed error information
3. **Report Specific Errors**: If issues persist, provide exact error messages from Network tab

## Contact Information
- **Backend URL**: http://localhost:5002
- **Frontend URL**: http://localhost:3000
- **Test User**: roee2912@gmail.com / 123456
