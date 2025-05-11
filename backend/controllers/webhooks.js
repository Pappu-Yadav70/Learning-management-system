import { Webhook } from "svix";
import User from "../models/User.js";
import Stripe from "stripe";
import { Purchase } from "../models/Purchase.js";
import Course from "../models/Course.js";



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
                    email: data.email_addresses[0].email_address,
                    name: data.first_name + " " + data.last_name,
                    imageUrl: data.image_url,

                }
                await User.create(userData) // it will store the data on mongodb database
                res.json({})
                break;

            }
                // user updation on database
            case 'user.updated':{
                 const userData = {
                    email: data.email_addresess[0].email_address,
                    name: data.first_name + " " + data.last_name,
                    imageUrl: data.image_url,

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

// handle stripe webhooks
const stripeInstance = new Stripe(process.env.STRIPE_WEBHOOK_SECRET)
export const stripeWebhooks = async(request, response)=>{
     const sig = request.headers['stripe-signature'];

  let event;

  try {
    event = Stripe.webhooks.constructEvent(request.body, sig, process.env.STRIPE_WEBHOOK_SECRET );
  }
  catch (err) {
    response.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':{
      const paymentIntent = event.data.object;
      const paymentIntentId = paymentIntent.id

       const session = await stripeInstance.checkout.sessions.list({
        payment_intent: paymentIntentId
        
      })
      const {purchasedId} = session.data[0].metadata;

      const purchaseData = await Purchase.findById(purchasedId)
      const userData = await User.findById(purchaseData.userId)

      const courseData = await Course.findById(purchaseData.courseId.toString())
     
    //   push the course data in user data on mongodb
      courseData.enrolledStudents.push(userData)
      await courseData.save()

      //push the user data in course data on mongodb
      userData.enrolledCourses.push(courseData._id)
      await userData.save()

      purchaseData.status = 'completed'
      await purchaseData.save()

     break;
  
    }
    
    case 'payment_intent.payment_failed':{
        
      const paymentIntent = event.data.object;
      const paymentIntentId = paymentIntent.id

       const session = await stripeInstance.checkout.sessions.list({
        payment_intent: paymentIntentId
        
      })
      const {purchasedId} = session.data[0].metadata;

      const purchaseData = await Purchase.findById(purchasedId)
       purchaseData.status = 'failed'
       await purchaseData.save()
     
      break;}
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }
   // Return a response to acknowledge receipt of the event
     response.json({received: true});

}