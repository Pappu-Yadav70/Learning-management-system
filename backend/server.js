import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './config/mongodb.js';
import { clerkwebhooks } from './controllers/webhooks.js';
import bodyParser from 'body-parser'; // Needed for raw body parsing for Clerk

// ✅ Initialize express
const app = express();

// ✅ Connect to MongoDB
await connectDB();

// ✅ Middleware
app.use(cors()); // Enable CORS so frontend from different origin can access the backend

// ✅ Raw body parser ONLY for Clerk webhooks (required for signature verification)
app.use('/clerk', bodyParser.raw({ type: 'application/json' }));

// ✅ Routes
app.get('/', (req, res) => res.send('API WORKING'));

// ✅ Clerk webhook route — must come after raw parser
app.post('/clerk', clerkwebhooks);

// ✅ For all other routes, use regular JSON parser (after Clerk route)
app.use(express.json());

// ✅ Server port
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
