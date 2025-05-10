
import express from 'express';
import cors from 'cors';
import 'dotenv/config'
import connectDB from './config/mongodb.js';
import { clerkwebhooks } from './controllers/webhooks.js';


// intialize  express

const app = express();


// connect to databse
await connectDB()


// middleware
app.use(cors())  //using cors becz we can  connect our backend other domain

// Routes
app.get('/', (req,res)=> res.send("API WORKING"))
app.post('/clerk', express.json(), clerkwebhooks)



// port
const PORT = process.env.PORT || 5000


app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`)
})