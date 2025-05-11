import express from 'express';
import cors from 'cors';
import 'dotenv/config'
import connectDB from './config/mongodb.js';
import { clerkwebhooks, stripeWebhooks } from './controllers/webhooks.js';
import educatorRouter from './Routes/educatorRoute.js';
import { clerkMiddleware } from '@clerk/express';
import connectCloudinary from './config/cloudinary.js';
import courseRouter from './Routes/courseRoute.js';
import userRouter from './Routes/userRoute.js';


// intialize  express

const app = express();


// connect to databse
await connectDB();
await connectCloudinary();


// middleware
app.use(cors())  //using cors becz we can  connect our backend other domain
app.use(clerkMiddleware())

// Routes
app.get('/', (req,res)=> res.send("API WORKING"))

app.post('/clerk', express.json(), clerkwebhooks)

app.use('/api/educator', express.json(), educatorRouter)

app.use('/api/course', express.json(), courseRouter)

app.use('/api/user', express.json(), userRouter )
app.post('/stripe', express.raw({type:'application/json'}), stripeWebhooks)



// port
const PORT = process.env.PORT || 5000


app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`)
})