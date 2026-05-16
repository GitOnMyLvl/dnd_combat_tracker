export default function D20Icon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" aria-hidden="true">
      <polygon points="256,97.3 421.8,217.2 256,280.7" fill="currentColor" fillOpacity="0.95" />
      <polygon points="256,97.3 256,280.7 90.2,217.2" fill="currentColor" fillOpacity="0.75" />
      <polygon points="421.8,217.2 358.3,432.3 256,280.7" fill="currentColor" fillOpacity="0.55" />
      <polygon points="90.2,217.2 256,280.7 153.7,432.3" fill="currentColor" fillOpacity="0.45" />
      <polygon points="256,280.7 358.3,432.3 153.7,432.3" fill="currentColor" fillOpacity="0.3" />
      <polygon points="256,97.3 421.8,217.2 358.3,432.3 153.7,432.3 90.2,217.2" fill="none" stroke="currentColor" strokeWidth="7" strokeLinejoin="round" />
    </svg>
  )
}
