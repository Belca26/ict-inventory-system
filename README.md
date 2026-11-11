# ICT Inventory System

A web-based ICT Inventory Management System designed to help organizations efficiently manage, track, and monitor ICT assets from a centralized platform.

The system uses a modern full-stack architecture with a React/TypeScript frontend and a Node.js/Express/TypeScript backend, with Prisma ORM for database management.

---

## Project Overview

The ICT Inventory System provides a centralized platform for managing organizational ICT assets such as computers, networking equipment, peripherals, and other technology resources.

The system is designed to improve inventory accuracy, simplify asset tracking, reduce manual record keeping, and provide users with timely information about ICT resources.

---

## Objectives

The main objectives of the system are to:

- Centralize ICT asset records.
- Improve the accuracy of inventory information.
- Enable efficient registration and management of ICT assets.
- Allow users to search, filter, and monitor inventory.
- Improve tracking of ICT assets and their status.
- Provide secure user authentication and authorization.
- Generate inventory reports.
- Improve the overall efficiency of ICT asset management.

---

## Key Features

- User authentication and authorization
- ICT asset registration
- Asset categorization
- Asset information management
- Asset status tracking
- Asset search and filtering
- Dashboard and inventory statistics
- User management
- Form validation
- Secure API endpoints
- Rate limiting
- Email functionality
- Scheduled tasks
- PDF report generation
- Excel report generation
- Database management through Prisma
- Automated testing

---

# Technology Stack

## Frontend

The frontend is a React-based single-page application built with TypeScript and Vite.

### Technologies

- React 18
- TypeScript
- Vite
- React Router
- TanStack React Query
- React Hook Form
- Zod
- Axios
- Tailwind CSS
- Lucide React
- Recharts
- date-fns

### Frontend responsibilities

The frontend is responsible for:

- Providing the user interface.
- Handling navigation.
- Managing forms.
- Communicating with the backend API.
- Displaying inventory information.
- Displaying dashboards and charts.
- Handling client-side validation.
- Managing application state and server data.

---

## Backend

The backend is a REST API built with Node.js, Express, and TypeScript.

### Technologies

- Node.js
- Express.js
- TypeScript
- Prisma ORM
- JWT
- bcrypt
- Zod
- Helmet
- CORS
- Express Rate Limit
- Multer
- Nodemailer
- node-cron
- PDFKit
- ExcelJS

### Backend responsibilities

The backend is responsible for:

- Processing API requests.
- Business logic.
- Authentication and authorization.
- Database operations.
- Input validation.
- File handling.
- Report generation.
- Email services.
- Scheduled tasks.
- API security.

---

## Database

The backend uses **Prisma ORM** for database access and schema management.

Database migrations and client generation are handled through Prisma.

The exact database engine is configured in:

```text
backend/prisma/schema.prisma
```

---

# System Architecture

```text
                    ICT INVENTORY SYSTEM
                            │
              ┌─────────────┴─────────────┐
              │                           │
         FRONTEND                     BACKEND
              │                           │
      React + TypeScript          Node.js + Express
              │                           │
            Vite                    TypeScript
              │                           │
       React Router                    REST API
              │                           │
      React Query / Axios               │
              │                           │
              └──────────────┬────────────┘
                             │
                         Prisma ORM
                             │
                         DATABASE
```

---

# Project Structure

```text
ict-inventory-system/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.*
│   └── ...
│
├── backend/
│   ├── src/
│   ├── prisma/
│   ├── package.json
│   ├── tsconfig.json
│   └── ...
│
├── .gitignore
├── .env.example
└── README.md
```

---

# Prerequisites

Before running the system, install:

- Node.js
- npm
- Git
- The database configured in `backend/prisma/schema.prisma`

You can verify Node.js and npm using:

```bash
node --version
npm --version
```

---

# Installation

## 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/ict-inventory-system.git
```

Navigate into the project:

```bash
cd ict-inventory-system
```

---

# Backend Setup

## 2. Navigate to the Backend

```bash
cd backend
```

## 3. Install Dependencies

```bash
npm install
```

## 4. Configure Environment Variables

Create a `.env` file inside the `backend` directory.

Use the project's `.env.example` file as a reference.

Example:

```env
PORT=5000
DATABASE_URL=your_database_connection_string
JWT_SECRET=your_secret_key
```

Do not commit the `.env` file to GitHub.

---

## 5. Generate Prisma Client

```bash
npm run prisma:generate
```

## 6. Run Database Migrations

```bash
npm run prisma:migrate
```

## 7. Seed the Database

If seed data is required:

```bash
npm run prisma:seed
```

## 8. Start the Backend in Development Mode

```bash
npm run dev
```

The backend will start using the development configuration defined in `package.json`.

---

# Frontend Setup

Open another terminal and navigate to the frontend:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create the required frontend `.env` file if the application uses frontend environment variables.

Start the development server:

```bash
npm run dev
```

The Vite development server will display the local URL in the terminal.

---

# Available Backend Commands

From the `backend` directory:

| Command | Description |
|---|---|
| `npm run dev` | Start backend in development mode |
| `npm run build` | Compile TypeScript |
| `npm start` | Start compiled backend |
| `npm run prisma:migrate` | Run Prisma database migrations |
| `npm run prisma:generate` | Generate Prisma Client |
| `npm run prisma:seed` | Seed the database |
| `npm run prisma:studio` | Open Prisma Studio |
| `npm test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Generate test coverage |

---

# Available Frontend Commands

From the `frontend` directory:

| Command | Description |
|---|---|
| `npm run dev` | Start Vite development server |
| `npm run build` | Build the frontend for production |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |

---

# Environment Variables

Environment variables are used to store configuration values and sensitive information.

Real environment files should not be committed to GitHub.

For example:

```text
.env
```

should remain private.

Example configuration files such as:

```text
.env.example
```

may be committed to GitHub.

---

# Security

The backend implements several security-related technologies, including:

- JSON Web Tokens (JWT)
- Password hashing with bcrypt
- Helmet security middleware
- CORS configuration
- Express rate limiting
- Zod input validation
- Environment-based configuration

Sensitive credentials such as database passwords, JWT secrets, API keys, and email credentials must never be committed to the repository.

---

# Reporting

The backend includes support for generating reports using:

- PDFKit for PDF documents
- ExcelJS for Excel spreadsheets

These features can be used to provide downloadable inventory reports.

---

# Testing

The backend uses Jest and Supertest for automated testing.

Run the test suite with:

```bash
npm test
```

To run tests continuously during development:

```bash
npm run test:watch
```

To generate test coverage:

```bash
npm run test:coverage
```

---

# Development Workflow

A typical development workflow is:

```text
Make changes
     ↓
Run and test the application
     ↓
git status
     ↓
git add .
     ↓
git commit -m "Describe changes"
     ↓
git push
```

---

# Git and GitHub

The project uses Git for version control and GitHub for source-code hosting.

To push future changes:

```bash
git add .
git commit -m "Describe your changes"
git push
```

---

# Future Improvements

Potential future improvements include:

- Advanced role-based access control
- QR code and barcode asset tracking
- Asset assignment history
- Asset maintenance management
- Automated email notifications
- Advanced inventory analytics
- Scheduled inventory reports
- PDF and Excel report customization
- Cloud deployment
- Automated database backups
- Audit logging
- Mobile application support

---

# Contributors

- Caleb
- Add other project contributors here

---

# Project Status

**Development**

The system is currently under active development.

---

# License

This project was developed for academic and/or organizational purposes.

A suitable open-source license can be added if the project is intended for public distribution.