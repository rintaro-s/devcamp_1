'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function ProblemDetailPage() {
  const { id } = useParams();
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python3');
  const [submissionResult, setSubmissionResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchProblem() {
      if (!id) return;
      try {
        const response = await fetch(`http://localhost:8000/problems`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const problems = await response.json();
        const foundProblem = problems.find(p => p.id === parseInt(id));
        if (foundProblem) {
          setProblem(foundProblem);
        } else {
          setError('Problem not found');
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }

    fetchProblem();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmissionResult(null);
    setError(null); // Clear previous errors

    try {
      const response = await fetch('http://localhost:8000/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          problem_id: parseInt(id),
          language,
          code,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error! status: ${response.status} - ${errorData.detail || response.statusText}`);
      }

      const result = await response.json();
      setSubmissionResult(result.review);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
        <p className="ml-4 text-xl text-gray-600">Loading problem details...</p>
      </div>
    );
  }

  if (error && !submissionResult) { // Only show error if it's a problem loading error, not submission error
    return <div className="text-center text-xl text-red-600 p-8">Error: {error}</div>;
  }

  if (!problem) {
    return <div className="text-center text-xl text-gray-600 p-8">Problem not found.</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-4xl font-extrabold mb-8 text-blue-700 text-center drop-shadow-sm">{problem.title}</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* Problem Description Section */}
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
          <h2 className="text-2xl font-bold mb-5 text-gray-800 border-b pb-3">Problem Description</h2>
          <div className="space-y-6 text-gray-700 text-lg">
            <div>
              <h3 className="text-xl font-semibold mb-2 text-blue-600">Description</h3>
              <p className="whitespace-pre-wrap leading-relaxed">{problem.description}</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2 text-blue-600">Input Format</h3>
              <p className="whitespace-pre-wrap leading-relaxed">{problem.input_format}</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2 text-blue-600">Output Format</h3>
              <p className="whitespace-pre-wrap leading-relaxed">{problem.output_format}</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2 text-blue-600">Sample Input</h3>
              <pre className="bg-gray-100 p-4 rounded-lg text-gray-800 overflow-auto whitespace-pre-wrap border border-gray-300 font-mono text-base leading-relaxed">{problem.sample_input}</pre>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2 text-blue-600">Sample Output</h3>
              <pre className="bg-gray-100 p-4 rounded-lg text-gray-800 overflow-auto whitespace-pre-wrap border border-gray-300 font-mono text-base leading-relaxed">{problem.sample_output}</pre>
            </div>
          </div>
        </div>

        {/* Code Submission Section */}
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 flex flex-col">
          <h2 className="text-2xl font-bold mb-5 text-gray-800 border-b pb-3">Submit Your Code</h2>
          <form onSubmit={handleSubmit} className="flex flex-col flex-grow">
            <div className="mb-6">
              <label htmlFor="language" className="block text-gray-700 text-lg font-semibold mb-2">Language:</label>
              <select
                id="language"
                className="shadow-sm border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="python3">Python 3</option>
                <option value="c">C</option>
                <option value="csharp">C#</option>
                <option value="cpp">C++</option>
                <option value="typescript">TypeScript</option>
                <option value="javascript">JavaScript</option>
              </select>
            </div>
            <div className="mb-6 flex-grow flex flex-col">
              <label htmlFor="code" className="block text-gray-700 text-lg font-semibold mb-2">Code:</label>
              <textarea
                id="code"
                className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-4 px-5 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-base flex-grow resize-none bg-gray-50"
                rows="15" // This will be overridden by flex-grow if container allows
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Write your code here..."
              ></textarea>
            </div>
            {error && submissionResult && ( // Only show submission error if it's a submission error
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-6" role="alert">
                <strong className="font-bold">Submission Error!</strong>
                <span className="block sm:inline"> {error}</span>
              </div>
            )}
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 text-lg"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Code'}
            </button>
          </form>
        </div>
      </div>

      {/* AI Review Result Section */}
      {submissionResult && (
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 mt-10">
          <h2 className="text-3xl font-extrabold mb-6 text-gray-800 text-center border-b pb-4">AI Review Result</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <p className="text-2xl mb-4">Score: <span className={`font-extrabold ${submissionResult.score >= 80 ? 'text-green-600' : submissionResult.score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>{
                submissionResult.score
              }</span></p>
              <p className="text-xl mb-4">Comments: <span className="text-gray-700 leading-relaxed">{submissionResult.comments}</span></p>
              {submissionResult.improvements && submissionResult.improvements.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-xl font-semibold mb-3 text-blue-600">Improvements:</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-2 text-lg">
                    {submissionResult.improvements.map((imp, index) => (
                      <li key={index}>{imp}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div>
              {submissionResult.execution_details && (
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 shadow-inner">
                  <h3 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">Execution Details:</h3>
                  <p className="mb-3 text-lg">Success: <span className={`font-semibold ${submissionResult.execution_details.success ? 'text-green-600' : 'text-red-600'}`}>{
                    submissionResult.execution_details.success ? 'Yes' : 'No'
                  }</span></p>
                  {submissionResult.execution_details.output && (
                    <div className="mb-3">
                      <p className="font-semibold text-lg">Output:</p>
                      <pre className="bg-gray-100 p-4 rounded-md text-gray-800 text-sm overflow-auto whitespace-pre-wrap border border-gray-300 font-mono leading-relaxed">{
                        submissionResult.execution_details.output
                      }</pre>
                    </div>
                  )}
                  {submissionResult.execution_details.error && (
                    <div className="mb-3">
                      <p className="font-semibold text-lg">Error:</p>
                      <pre className="bg-red-100 p-4 rounded-md text-red-800 text-sm overflow-auto whitespace-pre-wrap border border-red-300 font-mono leading-relaxed">{
                        submissionResult.execution_details.error
                      }</pre>
                    </div>
                  )}
                  <p className="text-base text-gray-600">Language: {submissionResult.execution_details.language}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
