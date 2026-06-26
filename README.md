
# 🚀 GENAI

A full-stack AI-powered interview preparation platform built with a **React/Vite** frontend and an **Express/MongoDB** backend.

---

## 💡 Overview

This project helps users generate custom, highly tailored interview reports and resume summaries using AI-based analysis. We take the stress out of interview prep by analyzing:

* 🎯 **Job descriptions**
* 📄 **Resume PDFs**
* 🗣️ **Self-descriptions**

The backend handles secure authentication and interview report management, while the frontend delivers a polished, seamless user experience for generating and reviewing your interview game plan.

---

## 💻 Tech Stack

* **Backend:** Node.js, Express, MongoDB, Mongoose 🟢
* **Authentication:** JWT, Cookies, bcrypt 🔒
* **File Upload:** Multer 📁
* **AI Integration:** Groq API (`groq-sdk`) 🧠
* **Frontend:** React, Vite, React Router, Sass ⚛️

---

## ✨ Features

* **User Security:** Secure user registration and login.
* **Data Protection:** Protected API routes for authenticated users.
* **Flexible Inputs:** Upload a resume PDF or simply provide a self-description.
* **Smart Insights:** Generate AI-driven, actionable interview reports.
* **History Tracking:** Store and fetch your recent interview reports.
* **Export Ready:** Generate resume output and PDF preparation endpoints.

---

## 📂 Repository Structure

* `📁 src/` - Core backend server code
* `📄 src/app.js` - Express app setup
* `📄 src/server.js` - Backend entry point
* `⚙️ src/config/database.js` - MongoDB connection
* `🛣️ src/routes/` - Auth and interview API routes
* `🎮 src/controllers/` - Request handlers
* `🛡️ src/middlewares/` - Auth and file upload handling
* `🗄️ src/models/` - MongoDB schemas
* `🤖 src/services/` - AI report generation service
* `💻 Frontend/` - React frontend application

---

## 🛠️ Getting Started

### 📋 Prerequisites

Ensure you have the following installed and ready:

* Node.js 18+ or later
* npm
* MongoDB connection URI
* Groq API key

### 📦 Install Dependencies

**Backend:**

```bash
npm install

```

**Frontend:**

```bash
cd Frontend
npm install

```

### 🔑 Environment Variables

Create a `.env` file at the project root 

### 🏃‍♂️ Run the Backend

From the project root:

```bash
npx nodemon src/server.js

```

> **Tip:** If you prefer, you can update the root `package.json` `dev` script to point at `src/server.js`.

### ⚛️ Run the Frontend

```bash
cd Frontend
npm run dev

```

> **Note:** The frontend expects the backend to be available at `http://localhost:3000` and will call API routes under `/api`.

---

## 🔌 API Endpoints

### 🔐 Authentication

| Method | Endpoint | Description |
| --- | --- | --- |
| **POST** | `/api/auth/register` | Register a new user |
| **POST** | `/api/auth/login` | Login and receive JWT cookie |
| **GET** | `/api/auth/logout` | Logout and blacklist token |
| **GET** | `/api/auth/get-me` | Get current authenticated user |

### 📊 Interview Report

| Method | Endpoint | Description |
| --- | --- | --- |
| **POST** | `/api/interview` | Generate a new interview report (*resume upload optional*) |
| **GET** | `/api/interview/report/:interviewId` | Fetch a specific report by its ID |
| **GET** | `/api/interview/` | Fetch all recent reports for the current user |
| **POST** | `/api/interview/resume/pdf/:interviewReportId` | Generate resume PDF output for a report |

---

## 📌 Important Notes

* **PDF Parsing:** Resume upload uses PDF parsing when a valid `.pdf` file is provided.
* **Fallback Input:** If no resume is uploaded, providing a self-description is **required**.
* **Storage Limits:** To keep things optimized, the backend retains only the **5 most recent** interview reports per user.

---

## 🤝 Contributing

We welcome contributions! Here is how you can help:

1. **Fork** the repository
2. **Create** a feature branch
3. **Open** a pull request with your awesome changes

---

## 📄 License

This project is licensed under the **ISC License** as defined in `package.json`.
