export default function OfflinePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto text-center">
        <h1 className="text-2xl font-bold mb-4">You're Offline</h1>
        <p className="text-gray-600 mb-4">
          Please check your internet connection and try again.
        </p>
        <p className="text-sm text-gray-500">
          Don't worry - any requests you've made will be synced when you're back online.
        </p>
      </div>
    </div>
  );
} 