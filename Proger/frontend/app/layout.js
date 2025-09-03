import './globals.css';
import Link from 'next/link'; // Import Link for better navigation

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 min-h-screen flex flex-col font-sans antialiased">
        <header className="bg-gradient-to-r from-blue-600 to-purple-700 text-white p-4 shadow-xl">
          <nav className="container mx-auto flex justify-between items-center">
            <Link href="/" className="text-3xl font-extrabold tracking-tight hover:text-blue-100 transition-colors duration-200">
              Proger
            </Link>
            <div className="space-x-4">
              <Link href="/problems" className="text-white hover:text-blue-200 px-4 py-2 rounded-full text-base font-medium transition-colors duration-200">
                Problems
              </Link>
              <Link href="/create-problem" className="bg-white text-blue-600 hover:bg-blue-50 hover:text-blue-700 px-4 py-2 rounded-full text-base font-medium transition-all duration-200 shadow-md">
                Create Problem
              </Link>
            </div>
          </nav>
        </header>
        <main className="flex-grow container mx-auto p-6">
          {children}
        </main>
        <footer className="bg-gray-800 text-gray-300 p-6 text-center text-sm border-t border-gray-700">
          &copy; {new Date().getFullYear()} Proger. All rights reserved. Built with ❤️ and Code.
        </footer>
      </body>
    </html>
  );
}