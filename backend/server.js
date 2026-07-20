import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { GalleryItem, VideoItem, Unit } from './models.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 5000;

if (!MONGO_URI) {
  console.error('CRITICAL ERROR: MONGO_URI is not defined in the environment variables.');
  process.exit(1);
}

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected successfully');
    seedDatabase();
  })
  .catch(err => console.error('MongoDB connection error:', err));

// In-memory track of active mirroring sessions
// Key: session ID, Value: current shared state
const sessions = {};

// Helper to seed data if empty
async function seedDatabase() {
  try {
    const galleryCount = await GalleryItem.countDocuments();
    if (galleryCount === 0) {
      await GalleryItem.insertMany([
        { title: 'Modern Living Room', url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80' },
        { title: 'Luxury Master Bedroom', url: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1200&q=80' },
        { title: 'Penthouse Skyline View', url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80' },
        { title: 'Infinity Swimming Pool', url: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=1200&q=80' },
        { title: 'Gourmet Kitchen', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80' },
        { title: 'Grand Lobby Entrance', url: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80' }
      ]);
      console.log('Gallery seeded.');
    }

    const videoCount = await VideoItem.countDocuments();
    if (videoCount === 0) {
      await VideoItem.insertMany([
        {
          title: 'Tower A Walkthrough Tour',
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          thumbnail: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80'
        },
        {
          title: 'Premium Penthouse Highlight',
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
          thumbnail: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80'
        },
        {
          title: 'Convrse Spaces Virtual Experience',
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          thumbnail: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=600&q=80'
        }
      ]);
      console.log('Videos seeded.');
    }

    const unitCount = await Unit.countDocuments();
    if (unitCount === 0) {
      const initialUnits = [];
      const towers = ['Tower A', 'Tower B', 'Tower C'];
      const floors = [1, 2, 3, 4];
      const unitsPerFloor = [1, 2, 3, 4];

      towers.forEach(tower => {
        floors.forEach(floor => {
          unitsPerFloor.forEach(u => {
            const unitNumber = `${floor}0${u}`;
            initialUnits.push({
              unitNumber,
              tower,
              status: 'Available',
              customerName: '',
              customerPhone: ''
            });
          });
        });
      });

      await Unit.insertMany(initialUnits);
      console.log('Units seeded.');
    }
  } catch (err) {
    console.error('Seeding database failed:', err);
  }
}

// REST APIs
app.get('/api/gallery', async (req, res) => {
  try {
    const items = await GalleryItem.find({});
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching gallery items' });
  }
});

app.get('/api/videos', async (req, res) => {
  try {
    const items = await VideoItem.find({});
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching video items' });
  }
});

app.get('/api/inventory', async (req, res) => {
  try {
    const units = await Unit.find({}).sort({ tower: 1, unitNumber: 1 });
    res.json(units);
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching units' });
  }
});

// Atomic Booking endpoint
app.post('/api/book', async (req, res) => {
  const { unitId, customerName, customerPhone } = req.body;

  if (!unitId || !customerName || !customerPhone) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Atomic update using findOneAndUpdate to prevent race conditions.
    // We only update if the unit exists and its status is 'Available'.
    const updatedUnit = await Unit.findOneAndUpdate(
      { _id: unitId, status: 'Available' },
      {
        $set: {
          status: 'Booked',
          customerName,
          customerPhone,
          bookedAt: new Date()
        }
      },
      { new: true } // return the updated document
    );

    if (!updatedUnit) {
      // Check if unit is already booked or doesn't exist
      const existing = await Unit.findById(unitId);
      if (!existing) {
        return res.status(404).json({ error: 'Unit not found' });
      }
      return res.status(409).json({ error: 'This unit has already been booked.' });
    }

    // Broadcast the inventory update to all connected socket clients
    io.emit('inventory-updated', updatedUnit);

    res.json({ success: true, unit: updatedUnit });
  } catch (err) {
    console.error('Booking error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Database reset endpoint (ideal for testing)
app.post('/api/reset', async (req, res) => {
  try {
    await Unit.updateMany({}, {
      $set: {
        status: 'Available',
        customerName: '',
        customerPhone: ''
      },
      $unset: { bookedAt: '' }
    });
    const updatedUnits = await Unit.find({}).sort({ tower: 1, unitNumber: 1 });
    io.emit('inventory-reset', updatedUnits);
    res.json({ success: true, message: 'All bookings cleared successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset inventory' });
  }
});

// Socket.io for Screen Mirroring and Real-time syncing
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join a specific presentation session
  socket.on('join-session', ({ sessionId, role }) => {
    socket.join(sessionId);
    console.log(`Socket ${socket.id} joined session ${sessionId} as ${role}`);

    // If session has existing state, send it to the newly joined client
    if (sessions[sessionId]) {
      socket.emit('session-state-sync', sessions[sessionId]);
    } else {
      // Initialize default session state
      sessions[sessionId] = {
        activeTab: 'gallery',
        previewImageId: null,
        activeVideoId: null,
        selectedTower: 'Tower A',
        selectedUnitId: null,
        bookingModalOpen: false,
        videoPlayerState: { playing: false, currentTime: 0 }
      };
    }
  });

  // Handle state updates from the Executive (driver)
  socket.on('update-session-state', ({ sessionId, updates }) => {
    if (!sessions[sessionId]) {
      sessions[sessionId] = {};
    }
    sessions[sessionId] = { ...sessions[sessionId], ...updates };
    
    // Broadcast state update to everyone else in the room
    socket.to(sessionId).emit('session-state-sync', sessions[sessionId]);
  });

  // Explicit event syncs (e.g. video playing control)
  socket.on('video-action', ({ sessionId, action, data }) => {
    socket.to(sessionId).emit('video-action', { action, data });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
