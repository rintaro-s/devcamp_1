'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ProblemsPage() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchProblems() {
      try {
        const response = await fetch('http://localhost:8000/problems');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setProblems(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }

    fetchProblems();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
        <p className="ml-4 text-xl text-gray-600">Loading problems...</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-xl text-red-600 p-8">Error loading problems: {error}</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-4xl font-extrabold mb-10 text-center text-gray-800 drop-shadow-sm">Available Problems</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {problems.length === 0 ? (
          <div className="col-span-full text-center p-12 bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col items-center justify-center">
            <p className="text-2xl text-gray-600 mb-6">No problems available yet.</p>
            <Link href="/create-problem" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg text-lg">
              Create Your First Problem!
            </Link>
          </div>
        ) : (
          problems.map((problem) => (
            <div key={problem.id} className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 flex flex-col group">
              <h2 className="text-2xl font-bold mb-4 text-blue-700 group-hover:text-blue-800 transition-colors duration-200">{problem.title}</h2>
              <p className="text-gray-700 mb-6 line-clamp-4 flex-grow">{problem.description}</p>
              <div className="mt-auto">
                <Link href={`/problems/${problem.id}`} className="inline-block bg-blue-500 text-white px-6 py-3 rounded-full hover:bg-blue-600 transition-colors duration-300 font-semibold shadow-md group-hover:shadow-lg">
                  Solve Problem
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}