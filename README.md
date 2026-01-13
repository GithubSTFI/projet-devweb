# Student Web Project

A full-stack web application built with **Angular** (Frontend) and **Node.js/Express** (Backend).

## Features
- **Data Persistence**: Uses SQLite to store items.
- **CRUD Operations**: Create, Read, Delete items.
- **File Handling**: Upload and Download files.
- **Async Processing**: Simulated background task processing.
- **Security**: Demonstration of SQL Injection vulnerability vs Secured endpoints.

## Prerequisites
- Node.js installed.
- Angular CLI (globally installed or via `npx`).

## Setup & Running

### 1. Backend
Navigate to the `backend` folder and install dependencies:
```bash
cd backend
npm install
```
Start the server:
```bash
npm start
# Server will run on http://localhost:3000
```

### 2. Frontend
Navigate to the `frontend` folder and install dependencies:
```bash
cd frontend
npm install
```
Start the Angular application:
```bash
ng serve
# Access the app at http://localhost:4200
```

## API Endpoints

### Items
- `GET /api/items`: List all items.
- `POST /api/items`: Create a new item.
- `DELETE /api/items/:id`: Delete an item.

### Files
- `POST /api/upload`: Upload a file (key: `file`).
- `GET /api/download/:filename`: Download a file.

### Async
- `POST /api/async-task`: Trigger a mock background task.

### Security Demo
- `GET /api/insecure/search?q=...`: Vulnerable search.
- `GET /api/secure/search?q=...`: Secure search.

## SQL Injection Demonstration
To test the vulnerability:
1. Call `/api/insecure/search?q=' OR '1'='1`
2. Observe that it returns ALL rows because the condition `1=1` is always true.
3. Call `/api/secure/search?q=' OR '1'='1`
4. Observe that it returns nothing or searches literally for that string.
