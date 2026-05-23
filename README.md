# DriveFleet Server ⚙️

Backend server for the **DriveFleet Car Rental Platform** — a modern system for managing cars, bookings, and user actions with secure authentication.

---

## 🌐 Frontend Links

- Live Site: https://drive-fleet-a09.vercel.app  
- Repository: https://github.com/jumana-rahman/A09-DriveFleet-Client   

---

## ✨ Features

- 🔐 Secure JWT-based authentication
- 🚗 Full CRUD for car management (Add, Update, Delete)
- 👤 Owner-based access control for cars
- 📅 Booking system for logged-in users
- 🔍 Search cars using MongoDB `$regex`
- 📦 RESTful API design
- ⚡ Fast and scalable Express + MongoDB backend
- 🛡️ Protected routes using middleware (`verifyToken`)
- 📊 Booking count tracking for cars

---

## 🛠️ Tech Stack

- Node.js
- Express.js
- MongoDB
- JOSE JWT (Authentication)
- dotenv
- CORS

---

## 📁 Project Setup

### 1. Clone Repository

```bash
git clone https://github.com/jumana-rahman/A09-DriveFleet-Server.git

```

### 2. Install Dependencies

```bash
npm install

```

### 3. Create .env File

```bash
PORT=8080
MONGODB_URI=mongodb_uri
CLIENT_URL=frontend_url

```

### 4. Run Server

```bash
npm run dev

```

👨‍💻 Developer
Developed by Jumana