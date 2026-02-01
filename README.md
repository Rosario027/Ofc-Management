# OfficeSync - Office Management Application

A comprehensive office management application with separate login flows for admins/proprietors and staff members. Built with React, TypeScript, Node.js, Express, PostgreSQL, and Drizzle ORM.

## Features

### Staff Features
- **Dashboard**: View pending tasks, upcoming deadlines, and monthly summary
- **Tasks**: View assigned tasks, update completion level, change status (pending, in-progress, completed, reassigned)
- **Attendance**: Mark daily attendance with check-in/check-out times
- **Leave Requests**: Submit leave applications (sick, casual, vacation, emergency, other)
- **Expense Claims**: Submit expense requests with categories and receipts
- **Monthly Summary**: View personal performance metrics

### Admin/Proprietor Features
- **Dashboard**: Overview of all activities, task priority distribution, attendance stats
- **Task Management**: Create, assign, and manage tasks for all employees
- **Employee Management**: Add, edit, and remove employees with role assignment
- **Attendance Log**: Monitor and manage attendance for all staff
- **Approvals**: Review and approve/reject leave requests and expense claims
- **Organization Management**: Create and manage multiple organizations
- **Monthly Summaries**: Generate performance reports for employees

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Radix UI, TanStack Query
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Authentication**: Session-based with bcrypt
- **Charts**: Recharts

## Deployment on Railway

### Prerequisites
1. A Railway account (https://railway.app)
2. A PostgreSQL database provisioned on Railway

### Step 1: Create a Railway Project

1. Log in to Railway and create a new project
2. Add a PostgreSQL database to your project
3. Note the `DATABASE_URL` from the database service

### Step 2: Deploy the Application

**Option A: Deploy from GitHub**

1. Push this code to a GitHub repository
2. In Railway, click "New" → "GitHub Repo"
3. Select your repository
4. Railway will automatically detect the Node.js application

**Option B: Deploy with Railway CLI**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# Deploy
railway up
```

### Step 3: Configure Environment Variables

In your Railway project dashboard, add the following environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `SESSION_SECRET` | Secret key for session encryption | `your-secret-key-here` |
| `NODE_ENV` | Environment mode | `production` |

### Step 4: Database Migration

After deployment, run the database migrations:

```bash
# Using Railway CLI
railway run npm run db:push

# Or using Railway Dashboard
# Go to your service → "Deploy" tab → Add a custom start command
```

### Step 5: Access the Application

Once deployed, Railway will provide a URL for your application. Access it and log in with the default admin credentials:

- **Email**: admin@officesync.com
- **Password**: admin123

**Important**: Change the default admin password after first login!

## Local Development

### Prerequisites
- Node.js 20+
- PostgreSQL database

### Setup

1. Clone the repository
```bash
git clone <repository-url>
cd officesync
```

2. Install dependencies
```bash
npm install
```

3. Create environment file
```bash
cp .env.example .env
```

4. Update `.env` with your database credentials

5. Run database migrations
```bash
npm run db:push
```

6. Start the development server
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Default Credentials

After initial setup, you can log in with:

- **Admin Account**:
  - Email: admin@officesync.com
  - Password: admin123

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Page components
│   │   │   ├── staff/      # Staff pages
│   │   │   └── admin/      # Admin pages
│   │   └── lib/            # Utilities
├── server/                 # Backend Express application
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Database operations
│   └── db.ts              # Database connection
├── shared/                 # Shared code between client/server
│   ├── schema.ts          # Database schema
│   └── routes.ts          # API route definitions
└── package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Organizations
- `GET /api/organizations` - List organizations
- `POST /api/organizations` - Create organization

### Users
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Tasks
- `GET /api/tasks` - List tasks
- `POST /api/tasks` - Create task
- `PATCH /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Attendance
- `GET /api/attendance` - List attendance records
- `POST /api/attendance` - Mark attendance

### Leaves
- `GET /api/leaves` - List leave requests
- `POST /api/leaves` - Create leave request
- `PATCH /api/leaves/:id/status` - Update leave status

### Expenses
- `GET /api/expenses` - List expenses
- `POST /api/expenses` - Create expense
- `PATCH /api/expenses/:id/status` - Update expense status

### Summaries
- `GET /api/summaries` - Get monthly summaries
- `POST /api/summaries/generate` - Generate summaries

## License

MIT
