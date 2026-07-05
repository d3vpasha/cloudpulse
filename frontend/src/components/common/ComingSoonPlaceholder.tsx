interface ComingSoonPlaceholderProps {
  feature: string
}

export default function ComingSoonPlaceholder({ feature }: ComingSoonPlaceholderProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{feature}</h2>
        <p className="text-gray-600 mb-4">This feature is coming soon</p>
        <div className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded">
          Coming soon in a future release
        </div>
      </div>
    </div>
  )
}
