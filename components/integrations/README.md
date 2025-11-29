# Integration Components

This directory contains components for managing external service integrations and data export.

## Components

### SyncStatus
Displays the current sync status of all connected integrations.

**Props:**
- `compact?: boolean` - Show compact version with minimal information

**Features:**
- Real-time sync status display
- Auto-refresh every 30 seconds
- Manual sync all button
- Error state indicators

**Usage:**
```tsx
import { SyncStatus } from '@/components/integrations'

// Full version
<SyncStatus />

// Compact version for header/sidebar
<SyncStatus compact />
```

### ExportPanel
Provides data export functionality with format and entity selection.

**Features:**
- Multiple export formats (JSON, CSV, PDF)
- Selective entity export
- Date range filtering
- Download management

**Usage:**
```tsx
import { ExportPanel } from '@/components/integrations'

<ExportPanel />
```

## Integration Flow

### Connecting an Integration

1. User clicks "Connect" on an integration card
2. POST request to `/api/integrations/connect` with provider
3. Server returns OAuth authorization URL
4. User is redirected to provider's OAuth page
5. After authorization, provider redirects to `/api/integrations/callback/[provider]`
6. Server exchanges code for tokens and creates integration record
7. User is redirected back to dashboard with success message

### Syncing Data

1. Manual sync: User clicks "Sync Now" button
2. Automatic sync: Scheduled based on `syncFrequency` setting
3. Server checks token expiry and refreshes if needed
4. Provider-specific sync logic fetches and updates data
5. `lastSyncAt` timestamp is updated

### Exporting Data

1. User selects format, entities, and date range
2. GET request to `/api/export` with query parameters
3. Server collects requested data from database
4. Data is formatted according to selected format
5. File is downloaded to user's device

## Supported Providers

- **Google Calendar**: Sync calendar events to tasks
- **Outlook**: Sync Outlook calendar to tasks
- **Fitbit**: Sync fitness data and activities
- **Apple Health**: Sync health and fitness data
- **Todoist**: Sync tasks and projects
- **Notion**: Sync pages and databases

## Environment Variables

Required for OAuth integrations:

```env
# Google Calendar
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret

# Outlook
OUTLOOK_CLIENT_ID=your_client_id
OUTLOOK_CLIENT_SECRET=your_client_secret

# App URL for OAuth callbacks
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Security Considerations

- OAuth tokens are stored encrypted in the database
- State parameter prevents CSRF attacks
- Token expiry is checked before each sync
- Refresh tokens are used to obtain new access tokens
- Sensitive data is never exposed to the client

## Future Enhancements

- Webhook support for real-time sync
- Conflict resolution UI for sync conflicts
- Integration health monitoring
- Custom sync schedules per integration
- Batch import from exported files
