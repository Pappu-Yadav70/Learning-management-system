import Stripe from "stripe"
import Course from "../models/Course.js"
import { Purchase } from "../models/Purchase.js"
import User from "../models/User.js"

// get user data
export const getUserData = async(req,res)=>{
    try {
        const userId = req.auth.userId
        const user = await User.findById(userId)

        if(!user){
            return res.json({success:false, message:'user not found'})
        }
        res.json({success:true, user})
    } catch (error) {
        res.json({success:false, message:error.message})
    }
}

// users enrolled courses with lecture links
export const  userEnrolledCourses = async(req,res)=>{
    try {
        const userId = req.auth.userId
        const userData = await User.findById(userId).populate('enrolledCourses')

        res.json({success:true, enrolledCourses: userData.enrolledCourses})
        
    } catch (error) {
        res.json({success:false, message:error.message})
        
    }
}


// purchase course
export const purchaseCourse = async (req,res)=>{
    try {
        const {courseId} = req.body
        const {origin} = req.headers
        const userId = req.auth.userId
        const userData = await User.findById(userId)
        const coursedata = await Course.findById(courseId)

        if(!userData || !coursedata){
            return res.json({success:false, message:'Data not found'})
        }
        const purchaseData = {
            courseId: coursedata._id,
            userId,
            amount:(coursedata.coursePrice - coursedata.discount * coursedata.coursePrice / 100).toFixed(2),
        }

        const newPurchase = await Purchase.create(purchaseData) //store the purchase in mongoDB

        // stripe gateway intialize
        const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY)
        const currency = process.env.CURRENCY.toLowerCase()

        // creating line items to for stripe
        const line_items = [{
            price_data:{
                currency,
                product_data:{
                    name: coursedata.courseTitle
                },
                unit_amount: Math.floor(newPurchase.amount)*100
            },
            quantity: 1
        }]
        const session = await stripeInstance.checkout.sessions.create({
            success_url: `${origin}/loading/my-enrollments`,
            cancel_url: `${origin}/`,
            line_items: line_items,
            mode:'payment',
            metadata:{
                purchaseId: newPurchase._id.toString()
            }
        })
        res.json({success:true, session_url: session.url})
    } catch (error) {
        res.json({success:false, message:error.message})
    }
}