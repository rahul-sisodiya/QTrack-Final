export default function Skeleton({ lines = 5 }) {
  return (
    <div>
      {[...Array(lines)].map((_, i) => (
        <div key={i} className="skeleton-line" />
      ))}
    </div>
  )
}