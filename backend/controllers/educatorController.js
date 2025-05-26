import {clerkClient} from '@clerk/express'
import Course from '../models/Course.js'
import {v2 as cloudinary} from 'cloudinary'
import { Purchase } from '../models/Purchase.js'
import User from '../models/User.js'
// import { JSON } from 'express'

// update role to educator
export const updateRoleToEducator = async (req,res) =>{
    try {
        const userId = req.auth.userId

        await clerkClient.users.updateUserMetadata(userId,{
            publicMetadata:{
                role: 'educator',
            }
        })
        res.json({success:true, message:'You can publish a course now'})
    } catch (error) {
        res.json({success:false, message:error.message})
    }
}



// add new course
export const addCourse = async(req, res)=>{
    try {
        const {courseData} = req.body
        const imageFile = req.file
        const educatorId = req.auth.userId

        if(!imageFile){
            return res.json({success:false, message:'Thumbnail Not Attached'})
        }
        const parsedCourseData = await JSON.parse(courseData)
        parsedCourseData.educator = educatorId
        const newCourse = await Course.create(parsedCourseData)
       const imageUpload =  await cloudinary.uploader.upload(imageFile.path)
       newCourse.courseThumbnail = imageUpload.secure_url
       await newCourse.save()

       res.json({success:true, message:'Course Added' })
    } catch (error) {
        res.json({success:false, message:error.message })
    }

}


//Get educator courses

export const getEducatorCourses = async(req, res)=>{
    try {
        const educator = req.auth.userId
        const courses = await Course.find({educator})
        res.json({success:true, courses}) 
    } catch (error) {
        res.json({success:false, message:error.message})
        
    }
}

// get educator dashboard data (total earning , enrolled students no. of courses)

export const educatorDashboardData = async (req, res) => {
  try {
    const educator = req.auth.userId;

    // Get educator's courses
    const courses = await Course.find({ educator });
    const courseIds = courses.map(course => course._id);
    const totalCourses = courseIds.length;

    // Get all completed purchases for these courses
    const purchases = await Purchase.find({
      courseId: { $in: courseIds },
      status: 'completed'
    }).populate('userId', 'name imageUrl')
      .populate('courseId', 'courseTitle');

    // Total earnings
    const totalEarnings = purchases.reduce((sum, p) => sum + p.amount, 0);

    // Format student enrollment data
    const enrolledStudentsData = purchases.map(purchase => ({
      courseTitle: purchase.courseId.courseTitle,
      student: {
        name: purchase.userId.name,
        imageUrl: purchase.userId.imageUrl
      }
    }));

    res.json({
      success: true,
      dashboardData: {
        totalCourses,
        totalEarnings,
        enrolledStudentData: enrolledStudentsData.length,
        enrolledStudentsData
      }
    });
  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


// get enrolled students data with purchase data
export const getEnrolledStudentsData = async (req, res)=>{
    try {
        const educator = req.auth.userId;
        const courses = await Course.find({educator});
        const courseId = courses.map(course=>course._id);

        const purchases = await Purchase.find({
            courseId: {$in: courseId},
            status:'completed'
        }).populate('userId', 'name imageUrl').populate('courseId', 'courseTitle')

        const enrolledStudents = purchases.map(purchase =>({
            students: purchase.userId,
            courseTitle: purchase.courseId.courseTitle,
            purchaseDate:purchase.createdAt

        }));
        res.json({success:true, enrolledStudents})
    } catch (error) {
        res.json({success:false, message:error.message});
        
    }
}

