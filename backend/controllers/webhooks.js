import { Webhook } from "svix";
import User from "../models/User.js";



// API CONTROLLER FUNCTION TO MANAGE CLERK USER WITH DATABSE

export const clerkwebhooks = async(req,res)=>{
    try {
        const webhook = new Webhook(process.env.CLERK_WEBHOOK_SECRET)
        
        await  webhook.verify(JSON.stringify(req.body),{
            "svix-id":req.headers['svix-id'],
            "svix-timestamp": req.headers["svix-timestamp"],
            "svix-signature": req.headers["svix-signature"]
        })

        //we need data from request body
        const {data,type} = req.body
        switch (type) {
            case 'user.created':{
                const userData = {
                    _id: data.id,
                    email: data.email_address[0].email_address,
                    name: data.first_name + " " + data.last_name,
                    image_url: data.image_url,

                }
                await User.create(userData) // it will store the data on mongodb database
                res.json({})
                break;

            }
                // user updation on database
            case 'user.updated':{
                 const userData = {
                    email: data.email_address[0].email_address,
                    name: data.first_name + " " + data.last_name,
                    image_url: data.image_url,

                }
                await User.findByIdAndUpdate(data.id,userData) //USED finbyuserdata method because we updating the user data
                res.json({})
                break
            }
             // user deletion on databse
            case 'user.deleted':{
               await User.findByIdAndDelete(data.id)
               res.json({})
               break;
            }
            default:
                break;
        }

    } catch (error) {
        res.json({success:false, message: error.message})
        
    }
}