export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <main className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-6xl font-bold mb-4">
            One<span className="text-purple-500">Song</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Connect DJs and audiences through music
          </p>
          
          <div className="space-y-4">
            <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-full">
              Join as DJ
            </button>
            <div className="inline-block mx-4">or</div>
            <button className="bg-transparent border-2 border-purple-600 hover:bg-purple-600/10 text-white font-bold py-2 px-6 rounded-full">
              Join as Guest
            </button>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-2">Request Songs</h3>
            <p className="text-gray-400">
              Search and request your favorite songs in real-time
            </p>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-2">Live Queue</h3>
            <p className="text-gray-400">
              See what's playing and what's coming up next
            </p>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-2">Support Artists</h3>
            <p className="text-gray-400">
              Show appreciation with tips and song dedications
            </p>
          </div>
        </div>
      </main>

      <footer className="fixed bottom-0 w-full bg-gray-900 py-4">
        <div className="container mx-auto px-4 text-center text-gray-400">
          OneSong © 2024 - Connect through music
        </div>
      </footer>
    </div>
  );
} 