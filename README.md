# Convrse Spaces - Sales Kiosk Application

An interactive, real-time MERN stack kiosk application designed for real estate developers. It helps sales executives guide prospective buyers through property walkthroughs, project images, and live apartment inventory, ensuring zero synchronization lag and absolute booking accuracy.

## 🚀 Key Features

1. **Synchronized Gallery**: High-quality visual gallery with an immersive full-screen modal preview.
2. **Real-time Video Control**: Syncs video playback state (play/pause/seeking/video changes) in real time.
3. **Interactive Live Inventory**: Display units mapped by tower (Tower A, B, C) with their live availability status.
4. **Atomic Bookings**: Booking operations are guaranteed atomic at the database level using MongoDB conditional updates (`findOneAndUpdate` matching status: `'Available'`), preventing race conditions or double bookings.
5. **Cross-Device Screen Mirroring (Core Evaluation)**: Real-time mirror of active tab navigation, gallery preview overlays, video selection, video playback, inventory tower selection, and booking modal display.
6. **Beyond the Scope (Session Roles)**: Supported multi-device pairing where a device selected as **Sales Executive** (Driver) steers the customer experience, while the **Customer Display** acts as a read-only viewer, mirroring every move instantly.

---

## 🛠️ Technology Stack

- **Frontend**: React (Vite), Socket.io-client, Lucide-React, Vanilla CSS (sleek dark glassmorphic design)
- **Backend**: Node.js, Express, Socket.io, MongoDB Atlas (Mongoose)

---

## 📁 Project Structure

```text
├── backend/
│   ├── package.json
│   ├── models.js          # Mongoose Schemas (Gallery, Video, Unit)
│   └── server.js          # Express app + Socket.io Server + MongoDB Connection
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── index.css      # Vanilla CSS UI Theme
│       ├── App.jsx        # Main synced state wrapper
│       └── components/
│           ├── RoleSelection.jsx
│           ├── Gallery.jsx
│           ├── Videos.jsx
│           └── Inventory.jsx
└── README.md
```

---

## ⚙️ Setup & Running Locally

### Prerequisites
- Node.js (v16+)
- npm

### 1. Run the Backend
Go to the backend directory, install packages, and start the server:
```bash
cd backend
npm install
npm run dev
```
*Note: The server will run on `http://localhost:5000` and automatically seed sample projects, video links, and 48 units across 3 towers into MongoDB.*

### 2. Run the Frontend
Go to the frontend directory, install packages, and start the development server:
```bash
cd ../frontend
npm install
npm run dev
```
*Note: The React application will run on `http://localhost:3000`.*

---

## 🔬 Testing Real-time Mirroring & Atomic Booking

1. Open two separate browser tabs side-by-side at `http://localhost:3000`.
2. Connect both to the same Showroom ID (e.g. `showroom-1`).
   - Select **Sales Executive** for Tab 1.
   - Select **Customer Display** for Tab 2.
3. **Navigation Sync**: Click tabs on Tab 1 -> Tab 2 switches automatically.
4. **Gallery Sync**: Go to Gallery on Tab 1 and click an image -> Tab 2 shows the modal preview immediately. Close it on Tab 1 -> Tab 2 closes it.
5. **Video Sync**: Play a video on Tab 1 -> Tab 2 begins playback at the exact same timestamp. Pause on Tab 1 -> Tab 2 pauses.
6. **Inventory Selection**: Click Tower B on Tab 1 -> Tab 2 switches to Tower B.
7. **Modal Sync & Booking**: Click Unit `102` on Tab 1 -> Booking modal appears on both screens (showing form for Executive, loading/sync state for Customer). Fill in customer info and click book. The unit instantly updates to "Booked" on both screens.
