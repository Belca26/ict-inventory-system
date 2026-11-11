# ICT Inventory System

## Project Overview

The ICT Inventory System is a web-based application designed to help organizations manage and track ICT assets efficiently. The system provides a centralized platform for recording, monitoring, updating, and managing information about computers, networking equipment, peripherals, software, and other ICT assets.

The system consists of a frontend application that provides the user interface and a backend application responsible for business logic, database operations, authentication, and API services.

## Main Objectives

- To provide centralized management of ICT assets.
- To maintain accurate records of IsssCT equipment.
- To enable users to add, update, view, and manage inventory records.
- To improve tracking of ICT equipment within an organization.
- To reduce manual inventory management.
- To provide secure access to inventory information.
- To improve the efficiency and accuracy of ICT asset management.

## Key Features

- User authentication and authorization
- ICT asset registration
- Asset information management
- Asset updating and deletion
- Asset search and filtering
- Inventory tracking
- Asset categorization
- User management
- Dashboard and inventory statistics
- Backend REST API
- Database integration

## System Architecture

The application is divided into two major components:

```text
ICT Inventory System
│
├── Frontend
│   └── User Interface
│
└── Backend
    ├── REST API
    ├── Business Logic
    ├── Authentication
    └── Database
```

## Project Structure

```text
ict-inventory-system/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── backend/
│   ├── src/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── package.json
│   └── ...
│
├── .env.example
├── .gitignore
├── README.md
└── ...
```

## Technologies Used

### Frontend

- [Add your frontend framework here]
- HTML5
- CSS3
- JavaScript
- [Add other frontend technologies]

### Backend

- Node.js
- Express.js
- REST API
- [Add other backend technologies]

### Database

- [Add your database here]

### Development Tools

- Git
- GitHub
- Visual Studio Code
- Postman
- npm

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/ict-inventory-system.git
```

Navigate into the project:

```bash
cd ict-inventory-system
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Configure Backend Environment Variables

Create a `.env` file inside the `backend` directory.

Use the `.env.example` file as a reference.

Example:

```env
PORT=5000
DATABASE_URL=your_database_connection
JWT_SECRET=your_secret_key
```

Do not commit the `.env` file to GitHub.

### 4. Start the Backend

```bash
npm run dev
```

or:

```bash
npm start
```

depending on the project's configuration.

### 5. Install Frontend Dependencies

Open another terminal and run:

```bash
cd frontend
npm install
```

### 6. Configure Frontend Environment Variables

Create the appropriate `.env` file using the frontend `.env.example` as a reference.

### 7. Start the Frontend

```bash
npm run dev
```

The frontend will normally be available at the local address displayed by the development server.

## Environment Variables

Environment variables are used to store configuration information and sensitive credentials.

Actual `.env` files should **never be committed to GitHub**.

Example environment variables:

```env
PORT=5000
DATABASE_URL=your_database_url
JWT_SECRET=your_secret
```

## API

The backend provides REST API endpoints used by the frontend to communicate with the system.

Example API structure:

```text
/api/auth
/api/users
/api/assets
/api/categories
/api/dashboard
```

The exact endpoints depend on the implementation of the system.

## Security

The system is designed with security considerations including:

- Authentication
- Authorization
- Password protection
- Environment variables for sensitive configuration
- Input validation
- Protected API endpoints
- Secure database access

Sensitive credentials must not be stored directly in source code or committed to GitHub.

## Future Improvements

Possible future improvements include:

- Email notifications
- Asset maintenance tracking
- Asset assignment history
- Automated reports
- Exporting inventory reports to PDF or Excel
- Advanced analytics
- Role-based access control
- Barcode or QR-code asset tracking
- Cloud deployment
- Automated database backups

## Contributors

- Caleb
- [Add other team members]

## License

This project was developed for academic/project purposes.

A suitable open-source license can be added if the project is intended for public distribution.# ICT Inventory System

## Project Overview

The ICT Inventory System is a web-based application designed to help organizations manage and track ICT assets efficiently. The system provides a centralized platform for recording, monitoring, updating, and managing information about computers, networking equipment, peripherals, software, and other ICT assets.

The system consists of a frontend application that provides the user interface and a backend application responsible for business logic, database operations, authentication, and API services.

## Main Objectives

- To provide centralized management of ICT assets.
- To maintain accurate records of ICT equipment.
- To enable users to add, update, view, and manage inventory records.
- To improve tracking of ICT equipment within an organization.
- To reduce manual inventory management.
- To provide secure access to inventory information.
- To improve the efficiency and accuracy of ICT asset management.

## Key Features

- User authentication and authorization
- ICT asset registration
- Asset information management
- Asset updating and deletion
- Asset search and filtering
- Inventory tracking
- Asset categorization
- User management
- Dashboard and inventory statistics
- Backend REST API
- Database integration

## System Architecture

The application is divided into two major components:

```text
ICT Inventory System
│
├── Frontend
│   └── User Interface
│
└── Backend
    ├── REST API
    ├── Business Logic
    ├── Authentication
    └── Database
```

## Project Structure

```text
ict-inventory-system/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── backend/
│   ├── src/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── package.json
│   └── ...
│
├── .env.example
├── .gitignore
├── README.md
└── ...
```

## Technologies Used

### Frontend

- [Add your frontend framework here]
- HTML5
- CSS3
- JavaScript
- [Add other frontend technologies]

### Backend

- Node.js
- Express.js
- REST API
- [Add other backend technologies]

### Database

- [Add your database here]

### Development Tools

- Git
- GitHub
- Visual Studio Code
- Postman
- npm

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/ict-inventory-system.git
```

Navigate into the project:

```bash
cd ict-inventory-system
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Configure Backend Environment Variables

Create a `.env` file inside the `backend` directory.

Use the `.env.example` file as a reference.

Example:

```env
PORT=5000
DATABASE_URL=your_database_connection
JWT_SECRET=your_secret_key
```

Do not commit the `.env` file to GitHub.

### 4. Start the Backend

```bash
npm run dev
```

or:

```bash
npm start
```

depending on the project's configuration.

### 5. Install Frontend Dependencies

Open another terminal and run:

```bash
cd frontend
npm install
```

### 6. Configure Frontend Environment Variables

Create the appropriate `.env` file using the frontend `.env.example` as a reference.

### 7. Start the Frontend

```bash
npm run dev
```

The frontend will normally be available at the local address displayed by the development server.

## Environment Variables

Environment variables are used to store configuration information and sensitive credentials.

Actual `.env` files should **never be committed to GitHub**.

Example environment variables:

```env
PORT=5000
DATABASE_URL=your_database_url
JWT_SECRET=your_secret
```

## API

The backend provides REST API endpoints used by the frontend to communicate with the system.

Example API structure:

```text
/api/auth
/api/users
/api/assets
/api/categories
/api/dashboard
```

The exact endpoints depend on the implementation of the system.

## Security

The system is designed with security considerations including:

- Authentication
- Authorization
- Password protection
- Environment variables for sensitive configuration
- Input validation
- Protected API endpoints
- Secure database access

Sensitive credentials must not be stored directly in source code or committed to GitHub.

## Future Improvements

Possible future improvements include:

- Email notifications
- Asset maintenance tracking
- Asset assignment history
- Automated reports
- Exporting inventory reports to PDF or Excel
- Advanced analytics
- Role-based access control
- Barcode or QR-code asset tracking
- Cloud deployment
- Automated database backups

## Contributors

- Caleb
- [Add other team members]

## License

This project was developed for academic/project purposes.

A suitable open-source license can be added if the project is intended for public distribution.