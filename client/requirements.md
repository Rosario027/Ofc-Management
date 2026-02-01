## Packages
recharts | For dashboard analytics and attendance charts
date-fns | For robust date formatting and manipulation

## Notes
- Role-based access control (RBAC) relies on `/api/users/me` returning the role (admin/staff/proprietor).
- Admin and Proprietor share the same "Admin Dashboard" view.
- Replit Auth handles the core login session; role management is handled via the separate `user_roles` table.
