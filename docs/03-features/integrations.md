# Integration and Export Features

This document describes the integration and export features implemented in the Professional Life Management Platform.

## Overview

The platform supports connecting external services via OAuth and exporting user data in multiple formats.

## Features Implemented

### 1. Integration Framework

**Database Schema:**
- `Integration` model with OAuth token storage
- Support for multiple providers per user
- Sync scheduling and status tracking

**Services:**
- `IntegrationService`: Manages OAuth flows and data synchronization
- `IntegrationRepository`: Database operations for integrations

**Key Features:**
- OAuth 2.0 authorization flow
- Automatic token refresh
- Scheduled sync based on frequency settings
- Error handling and status tracking

### 2. API Endpoints

#### GET /api/integrations
Get all integrations for the authenticated user.

**Response:**
```json
[
  {
    "id": "integration_id",
    "provider": "GOOGLE_CALENDAR",
    "status": "ACTIVE",
    "lastSyncAt": "2024-01-01T00:00:00Z",
    "syncFrequency": "HOURLY",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
]
```

#### POST /api/integrations/connect
Initiate OAuth flow for connecting an integration.

**Request:**
```json
{
  "provider": "GOOGLE_CALENDAR"
}
```

**Response:**
```json
{
  "authorizationUrl": "https://accounts.google.com/o/oauth2/v2/auth?...",
  "state": "base64_encoded_state"
}
```

#### DELETE /api/integrations/[id]
Disconnect an integration.

**Response:**
```json
{
  "message": "Integration disconnected successfully"
}
```

#### POST /api/integrations/sync
Manually trigger sync for one or all integrations.

**Request (specific integration):**
```json
{
  "integrationId": "integration_id"
}
```

**Request (all integrations):**
```json
{}
```

**Response:**
```json
{
  "total": 3,
  "synced": 2,
  "message": "Synced 2 of 3 integrations"
}
```

#### GET /api/integrations/callback/[provider]
OAuth callback handler (automatically called by provider).

#### GET /api/export
Export user data in various formats.

**Query Parameters:**
- `format`: Export format (JSON, CSV, PDF)
- `entities`: Comma-separated list of entities to export (optional)
- `startDate`: Start date for filtering (optional)
- `endDate`: End date for filtering (optional)

**Example:**
```
GET /api/export?format=JSON&entities=tasks,habits&startDate=2024-01-01&endDate=2024-12-31
```

**Response:**
File download with appropriate content type and filename.

### 3. UI Components

#### IntegrationSettings Page (`/integrations`)
Full-page interface for managing integrations.

**Features:**
- Grid view of available providers
- Connect/disconnect buttons
- Sync status display
- Manual sync triggers

#### SyncStatus Component
Displays current sync status of all integrations.

**Props:**
- `compact?: boolean` - Show compact version

**Usage:**
```tsx
import { SyncStatus } from '@/components/integrations'

<SyncStatus />
<SyncStatus compact />
```

#### ExportPanel Component
Data export interface with format and entity selection.

**Features:**
- Format selection (JSON, CSV, PDF)
- Entity selection with checkboxes
- Date range filtering
- Download management

**Usage:**
```tsx
import { ExportPanel } from '@/components/integrations'

<ExportPanel />
```

## Supported Providers

### Currently Configured
- Google Calendar
- Outlook Calendar
- Fitbit
- Apple Health
- Todoist
- Notion

### Adding New Providers

1. Add OAuth configuration in `IntegrationService`:
```typescript
this.oauthConfigs.set('PROVIDER_NAME', {
  clientId: process.env.PROVIDER_CLIENT_ID,
  clientSecret: process.env.PROVIDER_CLIENT_SECRET,
  redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/callback/provider`,
  authorizationUrl: 'https://provider.com/oauth/authorize',
  tokenUrl: 'https://provider.com/oauth/token',
  scopes: ['scope1', 'scope2'],
})
```

2. Implement provider-specific sync logic in `performProviderSync()`.

3. Add provider info to `PROVIDER_INFO` in IntegrationSettings page.

4. Set environment variables:
```env
PROVIDER_CLIENT_ID=your_client_id
PROVIDER_CLIENT_SECRET=your_client_secret
```

## Environment Variables

Required for OAuth integrations:

```env
# Google Calendar
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Outlook
OUTLOOK_CLIENT_ID=your_outlook_client_id
OUTLOOK_CLIENT_SECRET=your_outlook_client_secret

# App URL for OAuth callbacks
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Security

### OAuth Security
- State parameter prevents CSRF attacks
- State includes timestamp to prevent replay attacks (10-minute expiry)
- Tokens stored encrypted in database
- Sensitive data never exposed to client

### Token Management
- Access tokens automatically refreshed when expired
- Refresh tokens used to obtain new access tokens
- Failed refresh marks integration as ERROR status

### Data Export
- User authentication required
- Only user's own data can be exported
- No sensitive authentication data included in exports

## Data Export Formats

### JSON
Complete data with full structure, ideal for backup and data portability.

**Example:**
```json
{
  "profile": { ... },
  "tasks": [ ... ],
  "habits": [ ... ],
  ...
}
```

### CSV
Spreadsheet-compatible format with separate sections for each entity type.

**Format:**
```
# tasks
id,title,description,workspace,status,...
task1,Task 1,Description,PROFESSIONAL,COMPLETED,...

# habits
id,name,category,currentStreak,...
habit1,Exercise,HEALTH,15,...
```

### PDF
Professional report format (currently returns text representation, can be enhanced with proper PDF library).

## Sync Scheduling

### Automatic Sync
Integrations are automatically synced based on their `syncFrequency` setting:
- `MANUAL`: Only syncs when user triggers manually
- `HOURLY`: Syncs every hour
- `DAILY`: Syncs once per day

### Manual Sync
Users can trigger manual sync:
- Individual integration: Click "Sync Now" button
- All integrations: Click "Sync All" button

### Sync Process
1. Check if token needs refresh
2. Refresh token if expired
3. Fetch data from provider
4. Update local database
5. Update `lastSyncAt` timestamp
6. Update integration status

## Error Handling

### Integration Errors
- Token refresh failures mark integration as ERROR
- Network failures are logged and retried
- Invalid configurations prevent connection

### Export Errors
- Invalid format returns 400 error
- Invalid date format returns 400 error
- Database errors return 500 error
- All errors are logged for debugging

## Future Enhancements

### Phase 2
- Webhook support for real-time sync
- Conflict resolution UI
- Integration health monitoring
- Custom sync schedules
- Batch import from exported files
- Enhanced PDF export with charts and visualizations

### Phase 3
- Two-way sync (write back to providers)
- Advanced filtering and transformation rules
- Integration marketplace
- Custom integration builder
- API access for third-party integrations

## Testing

### Manual Testing
1. Navigate to `/integrations`
2. Click "Connect" on a provider
3. Complete OAuth flow
4. Verify integration appears as ACTIVE
5. Click "Sync Now" to test sync
6. Click "Disconnect" to remove integration

### Export Testing
1. Navigate to integrations page or use ExportPanel component
2. Select format (JSON, CSV, or PDF)
3. Optionally select specific entities
4. Optionally set date range
5. Click "Export" button
6. Verify file downloads correctly

## Troubleshooting

### OAuth Connection Fails
- Verify environment variables are set correctly
- Check OAuth credentials with provider
- Ensure redirect URI matches in provider settings
- Check browser console for errors

### Sync Fails
- Check integration status (should be ACTIVE)
- Verify token hasn't expired
- Check server logs for detailed error messages
- Try disconnecting and reconnecting

### Export Fails
- Verify user is authenticated
- Check date format (YYYY-MM-DD)
- Ensure entities parameter is comma-separated
- Check server logs for errors

## Related Files

### Backend
- `prisma/schema.prisma` - Integration model
- `lib/repositories/integration-repository.ts` - Database operations
- `lib/integrations/integration-service.ts` - OAuth and sync logic
- `lib/integrations/export-service.ts` - Data export logic
- `app/api/integrations/` - API endpoints

### Frontend
- `app/integrations/page.tsx` - Integration settings page
- `components/integrations/sync-status.tsx` - Sync status component
- `components/integrations/export-panel.tsx` - Export panel component
- `components/integrations/README.md` - Component documentation
