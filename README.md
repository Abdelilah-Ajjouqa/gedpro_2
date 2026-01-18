<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

# GEDPro - Modern Applicant Tracking System (ATS)

A robust backend for a modern Applicant Tracking System (ATS) and Electronic Document Management (EDM) platform, built with NestJS.

## 🚀 Features

### 🔐 Authentication & Security
- **JWT Authentication**: Secure login and registration.
- **RBAC (Role-Based Access Control)**: Fine-grained permissions for `ADMIN`, `RH`, `MANAGER`, and `CANDIDATE`.

### 👥 Candidate Management
- **Lifecycle Tracking**: Manage candidates from `NEW` to `ACCEPTED`.
- **History Logs**: Automatic audit trail of all status changes.
- **Documents**: Secure CV and document storage (Postgres metadata + Local storage).

### 📋 Dynamic Forms (NoSQL)
- **Hybrid Database**: Uses **MongoDB** for flexible form schemas.
- **Form Builder**: Create custom recruitment forms (text, ratings, select, etc.).
- **Responses**: Collect and store candidate answers.

### 📅 Interviews
- **Scheduling**: Book interviews linking Candidates, Users, and Times.
- **Status Management**: Track `SCHEDULED`, `COMPLETED`, or `CANCELLED` appointments.

## 🛠️ Technology Stack
- **Framework**: [NestJS](https://nestjs.com/)
- **Databases**:
  - **PostgreSQL** (via TypeORM): Structrued data (Users, Candidates, Interviews).
  - **MongoDB** (via Mongoose): Unstructured data (Dynamic Forms).
- **Documentation**: Swagger (OpenAPI) & VS Code REST Client.

## 🏁 Getting Started

### Prerequisites
- Node.js
- PostgreSQL
- MongoDB

### Installation
```bash
$ npm install
```

### Environment Setup
Create a `.env` file in the root directory:
```env
# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_DB=gedpro

MONGODB_URI=mongodb://localhost:27017/gedpro

# JWT
JWT_SECRET=super_secret_key
```

### Running the App
```bash
# development
$ npm run start

# watch mode
$ npm run start:dev
```

## 🧪 Testing the API

### 1. Swagger UI
Interactive documentation is available at:
> **http://localhost:3000/api**

### 2. VS Code REST Client
Use the included `requests.http` file to test endpoints directly in VS Code.

### 3. Testing Guide
Refer to [Testing Guide](./TESTING_GUIDE.md) (if generated) or the project artifacts for detailed curl commands.

## 📝 Modules Overview
| Module | Description | Endpoints |
|/---|---|---|
| **Auth** | Login, Register | `/auth/login`, `/auth/register` |
| **Users** | User management | `/users`, `/users/profile` |
| **Candidates** | Candidate profiles | `/candidates` |
| **Documents** | File uploads | `/documents` |
| **Forms** | Dynamic forms (MongoDB) | `/forms`, `/forms/:id/submit` |
| **Interviews** | Scheduling | `/interviews` |

## License
[MIT licensed](LICENSE).
