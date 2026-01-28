# Frontend Route Structure

## Overview

The Airavata portal uses a hierarchical route structure with permalinks and gateway-scoped routes for better organization and access control.

## Route Types

### 1. Permalink Routes (Public Access)

These routes provide direct, shareable links to specific resources. Access control is enforced at the page level.

- `/datasets/[datasetId]` - View a specific dataset
- `/repositories/[repositoryId]` - View a specific repository
- `/applications/[appId]` - View a specific application
- `/experiments/[experimentId]` - View a specific experiment

**Access Control:**
- If resource exists but user lacks permission → Shows "No Permissions" page
- If resource doesn't exist → Shows "Not Found" page
- If user has access → Shows resource details

### 2. Gateway-Scoped User Routes

User-level research items are scoped to a specific gateway:

- `/[gatewayName]/dashboard` - Gateway dashboard
- `/[gatewayName]/catalog` - Gateway catalog
- `/[gatewayName]/storage` - Gateway storage
- `/[gatewayName]/groups` - Gateway groups
- `/[gatewayName]/experiments` - Gateway experiments (future)

**Access Control:**
- Route guard checks if user has access to the gateway
- If no access → Redirects to "Not Found" page
- Gateway context is automatically set based on route parameter

### 3. Gateway-Scoped Admin Routes

Gateway administration routes are scoped to a specific gateway:

- `/[gatewayName]/admin/applications` - Manage applications
- `/[gatewayName]/admin/credentials` - Manage credentials
- `/[gatewayName]/admin/resource-access` - Manage resource access
- `/[gatewayName]/admin/preferences` - Manage preferences
- `/[gatewayName]/admin/users` - Manage users
- `/[gatewayName]/admin/notices` - Manage notices
- `/[gatewayName]/admin/statistics` - View statistics
- `/[gatewayName]/admin/settings` - Gateway settings

**Access Control:**
- Route guard checks if user has admin access to the gateway
- If no access → Redirects to "No Permissions" page
- Only gateway admins or root users can access

### 4. Root Admin Routes

System-level administration routes (root/admin only):

- `/admin/gateways` - Manage all gateways
- `/admin/compute-resources` - Manage compute resources
- `/admin/storage-resources` - Manage storage resources
- `/admin/workflows` - Manage workflows
- `/admin/parsers` - Manage data parsers

**Access Control:**
- Route guard checks if user is a root/admin user
- If not root user → Redirects to "No Permissions" page

## Route Guards

Route guards are implemented as React hooks:

### `useGatewayRouteGuard(gatewayName: string)`
- Ensures user has access to the specified gateway
- Redirects to `/not-found` if no access

### `useGatewayAdminRouteGuard(gatewayName: string)`
- Ensures user has admin access to the specified gateway
- Redirects to `/no-permissions` if no access

### `useRootAdminRouteGuard()`
- Ensures user is a root/admin user
- Redirects to `/no-permissions` if not root user

## Permalink Helpers

Use the permalink helper functions to generate consistent URLs:

```typescript
import { 
  getDatasetPermalink,
  getRepositoryPermalink,
  getApplicationPermalink,
  getExperimentPermalink,
  getCatalogResourcePermalink
} from "@/lib/permalink";

// Examples
const datasetUrl = getDatasetPermalink("dataset-123");
const repoUrl = getRepositoryPermalink("repo-456");
const appUrl = getApplicationPermalink("app-789");
const expUrl = getExperimentPermalink("exp-012");
const resourceUrl = getCatalogResourcePermalink("res-345", "DATASET");
```

## Navigation

The Sidebar component automatically builds routes based on:
1. Current path (detects if in gateway-scoped route)
2. Gateway context (selected gateway)
3. User permissions (root user vs regular user)

Routes are dynamically prefixed:
- If in `/[gatewayName]/*` route → Uses gateway name from path
- Otherwise → Uses gateway name from context

## Error Pages

### `/not-found`
- Shown when a resource doesn't exist
- Generic 404 page

### `/no-permissions`
- Shown when user lacks required permissions
- Used for both gateway admin and root admin access denials

### Resource-Specific Error Pages
- `NoPermissions` component - For specific resources (datasets, repositories, etc.)
- `NotFound` component - For specific resources that don't exist

## Migration Notes

### Old Routes → New Routes

| Old Route | New Route |
|-----------|-----------|
| `/dashboard` | `/[gatewayName]/dashboard` |
| `/catalog` | `/[gatewayName]/catalog` |
| `/storage` | `/[gatewayName]/storage` |
| `/admin/applications` | `/[gatewayName]/admin/applications` |
| `/admin/gateways` | `/admin/gateways` (root admin only) |
| `/catalog/dataset/[id]` | `/datasets/[id]` (permalink) |
| `/catalog/repository/[id]` | `/repositories/[id]` (permalink) |
| `/applications/[id]` | `/applications/[id]` (permalink) |
| `/experiments/[id]` | `/experiments/[id]` (permalink) |

### Backward Compatibility

The old `(dashboard)` routes still exist and work, but new code should use:
- Gateway-scoped routes for user-level items
- Permalink routes for direct resource access
- Root admin routes for system administration
