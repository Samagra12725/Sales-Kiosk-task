import mongoose from 'mongoose';

const gallerySchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String, required: true }
});

const videoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String, required: true },
  thumbnail: { type: String, required: true }
});

const unitSchema = new mongoose.Schema({
  unitNumber: { type: String, required: true },
  tower: { type: String, required: true },
  status: { type: String, enum: ['Available', 'Booked'], default: 'Available' },
  customerName: { type: String, default: '' },
  customerPhone: { type: String, default: '' },
  bookedAt: { type: Date }
}, {
  timestamps: true
});

// Ensure a unique compound index on unitNumber and tower to enforce uniqueness at the database layer
unitSchema.index({ unitNumber: 1, tower: 1 }, { unique: true });

export const GalleryItem = mongoose.model('GalleryItem', gallerySchema);
export const VideoItem = mongoose.model('VideoItem', videoSchema);
export const Unit = mongoose.model('Unit', unitSchema);
