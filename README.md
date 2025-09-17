# Real-Time Chat App

## Overview

This project is a full-stack real-time chat application built with a React frontend and a Node.js/Express backend. It supports user authentication, profile management, real-time messaging using Socket.IO, and theme customization using DaisyUI and Tailwind CSS. The backend uses MongoDB for data storage and Cloudinary for profile image uploads.

---

## High-Level Architecture

### 1. **Frontend (`/frontend`)**

- **Framework:** React (with Vite)
- **State Management:** Zustand
- **Styling:** Tailwind CSS, DaisyUI
- **Real-Time Communication:** socket.io-client
- **Features:**
  - User authentication (login, signup)
  - Profile management (update profile, upload avatar)
  - Real-time chat interface
  - Theme selection and preview
  - Responsive UI components

**Key Files:**

- `src/App.jsx` – Main app component, routing, theme logic
- `src/pages/` – Page components (Home, Login, Signup, Profile, Settings)
- `src/components/` – UI components (Sidebar, MessageInput, ChatWindow, etc.)
- `src/store/` – Zustand stores for auth, chat, and theme
- `src/lib/axios.js` – Axios instance for API calls
- `src/index.css` – Tailwind/DaisyUI CSS entry
- `tailwind.config.js` – Tailwind and DaisyUI theme config
- `vite.config.js` – Vite configuration

---

### 2. **Backend (`/backend`)**

- **Framework:** Node.js, Express
- **Database:** MongoDB (via Mongoose)
- **Real-Time Communication:** Socket.IO
- **Authentication:** JWT (JSON Web Tokens), bcryptjs
- **Image Uploads:** Cloudinary
- **Features:**
  - REST API for users and messages
  - JWT-based authentication and authorization
  - Real-time messaging and online user tracking
  - Profile image upload and management

**Key Files:**

- `src/index.js` – Express app entry, server setup, Socket.IO integration
- `src/controllers/` – Auth and message controllers
- `src/models/` – Mongoose schemas for User and Message
- `src/routes/` – API route definitions
- `src/lib/` – Database connection, Cloudinary config, Socket.IO logic, JWT utilities
- `src/middleware/` – Auth middleware for protected routes
- `.env` – Environment variables (MongoDB URI, JWT secret, Cloudinary keys, etc.)

---

### 3. **Common Patterns**

- **Environment Variables:** Managed via `.env` files for secrets and config.
- **API Communication:** Frontend uses Axios to communicate with backend REST endpoints.
- **Real-Time Updates:** Socket.IO used for instant message delivery and online status.
- **Theme Management:** DaisyUI themes selectable and previewed in frontend.

---

## Getting Started

1. **Clone the repository:**

   ```sh
   git clone https://github.com/EdwinShibuMathew/Real-Time-Chat-App.git
   ```

2. **Install dependencies:**

   - Backend:
     ```sh
     cd backend
     npm install
     ```
   - Frontend:
     ```sh
     cd ../frontend
     npm install
     ```

3. **Configure environment variables:**

   - Copy `.env.example` to `.env` in the backend folder and fill in your secrets.

4. **Run the app:**
   - Backend:
     ```sh
     npm run dev
     ```
   - Frontend:
     ```sh
     npm run dev
     ```

---

## Folder Structure

```
Real-Time-Chat-App/
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── lib/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   └── index.js
│   ├── .env
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── store/
│   │   ├── lib/
│   │   └── App.jsx
│   ├── tailwind.config.js
│   ├── vite.config.js
│   ├── postcss.config.js
│   ├── index.css
│   └── package.json
│
└── README.md
```

---

## License

This project is licensed under the terms of the [MIT License](./LICENSE).
