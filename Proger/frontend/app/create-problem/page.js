'use client';

import { useState } from 'react';

export default function CreateProblemPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [inputFormat, setInputFormat] = useState('');
  const [outputFormat, setOutputFormat] = useState('');
  const [sampleInput, setSampleInput] = useState('');
  const [sampleOutput, setSampleOutput] = useState('');
  const [testCases, setTestCases] = useState([{ input: '', output: '' }]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleAddTestCase = () => {
    setTestCases([...testCases, { input: '', output: '' }]);
  };

  const handleTestCaseChange = (index, field, value) => {
    const newTestCases = [...testCases];
    newTestCases[index][field] = value;
    setTestCases(newTestCases);
  };

  const handleRemoveTestCase = (index) => {
    const newTestCases = testCases.filter((_, i) => i !== index);
    setTestCases(newTestCases);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setSubmitting(true);

    const newProblem = {
      title,
      description,
      input_format: inputFormat,
      output_format: outputFormat,
      sample_input: sampleInput,
      sample_output: sampleOutput,
      test_cases: testCases.filter(tc => tc.input && tc.output), // Only send non-empty test cases
    };

    try {
      const response = await fetch('http://localhost:8000/problems', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProblem),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP error! status: ${response.status} - ${errorData.detail || response.statusText}`);
      }

      const data = await response.json();
      setMessage(`Problem "${data.title}" created successfully with ID: ${data.id}`);
      // Clear form
      setTitle('');
      setDescription('');
      setInputFormat('');
      setOutputFormat('');
      setSampleInput('');
      setSampleOutput('');
      setTestCases([{ input: '', output: '' }]);
    } catch (e) {
      setError(`Failed to create problem: ${e.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-4xl font-extrabold mb-8 text-center text-blue-700 drop-shadow-sm">Create New Problem</h1>
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
        {message && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg relative mb-6" role="alert">{message}</div>}
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-6" role="alert">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label htmlFor="title" className="block text-gray-700 text-lg font-semibold mb-2">Title:</label>
            <input
              type="text"
              id="title"
              className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="description" className="block text-gray-700 text-lg font-semibold mb-2">Description:</label>
            <textarea
              id="description"
              className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base"
              rows="5"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            ></textarea>
          </div>
          <div>
            <label htmlFor="inputFormat" className="block text-gray-700 text-lg font-semibold mb-2">Input Format:</label>
            <textarea
              id="inputFormat"
              className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base"
              rows="3"
              value={inputFormat}
              onChange={(e) => setInputFormat(e.target.value)}
              required
            ></textarea>
          </div>
          <div>
            <label htmlFor="outputFormat" className="block text-gray-700 text-lg font-semibold mb-2">Output Format:</label>
            <textarea
              id="outputFormat"
              className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base"
              rows="3"
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value)}
              required
            ></textarea>
          </div>
          <div>
            <label htmlFor="sampleInput" className="block text-gray-700 text-lg font-semibold mb-2">Sample Input:</label>
            <textarea
              id="sampleInput"
              className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base"
              rows="3"
              value={sampleInput}
              onChange={(e) => setSampleInput(e.target.value)}
              required
            ></textarea>
          </div>
          <div>
            <label htmlFor="sampleOutput" className="block text-gray-700 text-lg font-semibold mb-2">Sample Output:</label>
            <textarea
              id="sampleOutput"
              className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base"
              rows="3"
              value={sampleOutput}
              onChange={(e) => setSampleOutput(e.target.value)}
              required
            ></textarea>
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-5 text-gray-800 border-b pb-3">Test Cases</h2>
        {testCases.map((testCase, index) => (
          <div key={index} className="mb-8 p-6 border border-gray-300 rounded-xl relative bg-gray-50 shadow-inner">
            <h3 className="text-xl font-semibold mb-4 text-gray-700">Test Case {index + 1}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor={`testInput-${index}`} className="block text-gray-700 text-lg font-semibold mb-2">Input:</label>
                <textarea
                  id={`testInput-${index}`}
                  className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base"
                  rows="3"
                  value={testCase.input}
                  onChange={(e) => handleTestCaseChange(index, 'input', e.target.value)}
                ></textarea>
              </div>
              <div>
                <label htmlFor={`testOutput-${index}`} className="block text-gray-700 text-lg font-semibold mb-2">Output:</label>
                <textarea
                  id={`testOutput-${index}`}
                  className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base"
                  rows="3"
                  value={testCase.output}
                  onChange={(e) => handleTestCaseChange(index, 'output', e.target.value)}
                ></textarea>
              </div>
            </div>
            {testCases.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemoveTestCase(index)}
                className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white text-sm font-bold py-2 px-4 rounded-full transition-all duration-200 shadow-md"
              >
                Remove
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={handleAddTestCase}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 mb-8 text-lg"
        >
          Add Test Case
        </button>

        <button
          type="submit"
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-10 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 w-full text-lg"
          disabled={submitting}
        >
          {submitting ? 'Creating Problem...' : 'Create Problem'}
        </button>
      </form>
    </div>
  );
}