import { Webhook } from "svix";
import User from "../models/User.js";

// API CONTROLLER FUNCTION TO MANAGE CLERK USER WITH DATABASE
export const clerkwebhooks = async (req, res) => {
  try {
    const webhook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

    // ✅ Proper verification of Clerk webhook using rawBody
    const payload = webhook.verify(req.rawBody, {
      "svix-id": req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"],
    });

    // ✅ Getting type and data from verified Clerk payload
    const { data, type } = payload;

    switch (type) {
      // ✅ User creation in database when new user signs up on Clerk
      case "user.created": {
        const userData = {
          _id: data.id,
          email: data.email_addresses[0].email_address,
          name: `${data.first_name} ${data.last_name}`,
          image_url: data.image_url,
        };
        await User.create(userData); // It will store the data in MongoDB
        console.log("User created:", userData);
        res.json({});
        break;
      }

      // ✅ User updation in database when user details are changed on Clerk
      case "user.updated": {
        const userData = {
          email: data.email_addresses[0].email_address,
          name: `${data.first_name} ${data.last_name}`,
          image_url: data.image_url,
        };
        await User.findByIdAndUpdate(data.id, userData); // Used findByIdAndUpdate method because we are updating the user data
        console.log("User updated:", data.id);
        res.json({});
        break;
      }

      // ✅ User deletion in database when user is deleted from Clerk
      case "user.deleted": {
        await User.findByIdAndDelete(data.id); // Used findByIdAndDelete method because we are deleting user data
        console.log("User deleted:", data.id);
        res.json({});
        break;
      }

      default:
        console.log("Unhandled Clerk webhook type:", type);
        res.status(200).json({});
    }
  } catch (error) {
    console.error(" Clerk Webhook Error:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};
