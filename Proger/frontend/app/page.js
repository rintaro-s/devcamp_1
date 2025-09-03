import Link from 'next/link';

export default function Page() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-180px)] text-center px-4 py-12 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl shadow-lg border border-gray-100">
      <h1 className="text-6xl md:text-7xl font-extrabold text-gray-800 mb-8 leading-tight drop-shadow-md">
        Welcome to <span className="text-blue-700">Proger</span>!
      </h1>
      <p className="text-2xl md:text-3xl text-gray-600 mb-10 max-w-3xl leading-relaxed">
        Your ultimate platform for competitive programming practice. <br className="hidden md:inline"/> Create, solve, and get AI-powered reviews for your code.
      </p>
      <div className="flex flex-col sm:flex-row gap-6">
        <Link href="/problems" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-10 rounded-full shadow-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl text-lg">
          Start Practicing
        </Link>
        <Link href="/create-problem" className="bg-white border border-gray-300 text-gray-800 hover:bg-gray-100 font-bold py-4 px-10 rounded-full shadow-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl text-lg">
          Create a Problem
        </Link>
      </div>
    </div>
  );
}