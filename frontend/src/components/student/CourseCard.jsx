import React, { useContext } from 'react'
import { assets } from '../../assets/assets'
import { AppContext } from '../../context/AppContext'
import { Link } from 'react-router-dom'

const CourseCard = ({ course }) => {
  const { currency, calculateRating } = useContext(AppContext) // import currency symbol from appcontext

  // Defensive fallback values
  const educatorName = course.educator?.name || 'Unknown Educator'
  const thumbnail = course.courseThumbnail || assets.default_thumbnail // You should have a default image in your assets
  const title = course.courseTitle || 'Untitled Course'
  const rating = calculateRating(course) || 0
  const ratingCount = course.courseRatings?.length || 0
  const price = course.coursePrice ?? 0
  const discount = course.discount ?? 0
  const finalPrice = (price - (discount * price) / 100).toFixed(2)

  return (
    <Link
      to={'/course/' + course._id}
      onClick={() => scrollTo(0, 0)}
      className="border border-gray-500/30 pb-6 overflow-hidden rounded-lg"
    >
      <img className="w-full" src={thumbnail} alt={title} />
      <div className="p-3 text-left">
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="text-gray-500">{educatorName}</p>
        <div className="flex items-center space-x-2">
          <p>{rating}</p>
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <img
                key={i}
                src={i < Math.floor(rating) ? assets.star : assets.star_blank}
                className="w-3.5 h-3.5"
                alt={i < Math.floor(rating) ? 'Star filled' : 'Star empty'}
              />
            ))}
          </div>
          <p className="text-gray-500">{ratingCount}</p>
        </div>
        <p className="text-base font-semibold text-gray-800">
          {currency}
          {finalPrice}
        </p>
      </div>
    </Link>
  )
}

export default CourseCard
