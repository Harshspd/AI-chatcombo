import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();
const mongoURI = process.env.DB_URL;

// Connect to MongoDB
const connection = async () => {
  try {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected"); // <-- moved outside the connect options
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error.message);
  }
};

export default connection;
