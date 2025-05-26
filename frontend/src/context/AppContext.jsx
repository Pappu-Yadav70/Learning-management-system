import { createContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import humanizeDuration from "humanize-duration";
import { useAuth, useUser } from "@clerk/clerk-react";
import axios from "axios";
import { toast } from "react-toastify";

// Creating the global context
export const AppContext = createContext();

export const AppContextProvider = (props) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const currency = import.meta.env.VITE_CURRENCY;
  const navigate = useNavigate();

  const { getToken } = useAuth();
  const { user } = useUser();

  // Global state variables
  const [allCourses, setAllCourses] = useState([]);
  const [isEducator, setIsEducator] = useState(false);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [userData, setUserData] = useState(null);

  // Fetch all courses from the backend
  const fetchAllCourses = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/course/all`);
      if (data.success) {
        setAllCourses(data.courses);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Fetch current logged-in user data
  const fetchUserData = async () => {
    if (user?.publicMetadata?.role === "educator") {
      setIsEducator(true);
    }

    try {
      const token = await getToken();
      const { data } = await axios.get(`${backendUrl}/api/user/data`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setUserData(data.user);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Fetch user's enrolled courses
  const fetchUserEnrolledCourses = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get(`${backendUrl}/api/user/enrolled-courses`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        // Reversing to show most recent first
        setEnrolledCourses(data.enrolledCourses.reverse());
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Calculate average rating for a course
  const calculateRating = (course) => {
    if (!course?.courseRatings?.length) return 0;

    const totalRating = course.courseRatings.reduce((acc, rating) => acc + rating.rating, 0);
    return Math.floor(totalRating / course.courseRatings.length);
  };

  // Calculate duration of a chapter
  const calculateChapterTime = (chapter) => {
    if (!chapter?.chapterContent) return "0m";
    let time = 0;
    chapter.chapterContent.forEach((lecture) => {
      time += lecture.lectureDuration || 0;
    });
    return humanizeDuration(time * 60 * 1000, { units: ["h", "m"] });
  };

  // Calculate total course duration
  const calculateCourseDuration = (course) => {
    if (!course?.courseContent) return "0m";

    let time = 0;
    course.courseContent.forEach((chapter) => {
      chapter.chapterContent?.forEach((lecture) => {
        time += lecture.lectureDuration || 0;
      });
    });

    return humanizeDuration(time * 60 * 1000, { units: ["h", "m"] });
  };

  // Calculate total number of lectures in a course
  const calculateNoOfLectures = (course) => {
    if (!course?.courseContent) return 0;

    return course.courseContent.reduce((count, chapter) => {
      return count + (Array.isArray(chapter.chapterContent) ? chapter.chapterContent.length : 0);
    }, 0);
  };

  // Initial fetch when component mounts
  useEffect(() => {
    fetchAllCourses();
  }, []);

  // Fetch user-specific data once the user is available
  useEffect(() => {
    if (user) {
      fetchUserData();
      fetchUserEnrolledCourses();
    }
  }, [user]);

  // Context value available to all components
  const value = {
    currency,
    allCourses,
    navigate,
    calculateRating,
    isEducator,
    setIsEducator,
    calculateChapterTime,
    calculateCourseDuration,
    calculateNoOfLectures,
    enrolledCourses,
    fetchUserEnrolledCourses,
    backendUrl,
    userData,
    setUserData,
    getToken,
    fetchAllCourses,
  };

  return <AppContext.Provider value={value}>{props.children}</AppContext.Provider>;
};
