import React from 'react';
// Removed duplicate React import
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; // Import the GFM plugin
import { downloadFile } from '../utils/download'; // Import the download utility

// Define the possible step names
type StepName = 'extract' | 'match' | 'categorize';

interface ResultDisplayProps {
  title: string;
  data: any; // Keep as any for flexibility, but expect object with markdown property
  loading?: boolean;
  stepName: StepName; // Add stepName prop
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ title, data, loading = false, stepName }) => {

  // Button style - consistent with other buttons
  const downloadButtonStyle = "ml-2 px-3 py-1 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out";

  const handleDownloadJson = () => {
    if (!data) return;
    // Exclude the markdown part from the JSON download if it exists
    const jsonData = { ...data };
    delete jsonData.markdown;
    downloadFile(JSON.stringify(jsonData, null, 2), stepName, 'json');
  };

  const handleDownloadMarkdown = () => {
    if (!data || !data.markdown) return;
    downloadFile(data.markdown, stepName, 'md');
  };


  if (loading) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-lg animate-fade-in">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">{title}</h2>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-100 dark:border-primary-800 border-t-primary-500 dark:border-t-primary-400"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  // Extract markdown content if available, or fall back to JSON display
  const markdownContent = data.markdown || (typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-lg p-6 animate-fade-in">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100 flex items-center">
        <svg className="w-6 h-6 text-primary-500 dark:text-primary-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <span className="flex-grow">{title}</span> {/* Wrap title to allow buttons space */}
        {/* Download Buttons Container */}
        <div className="flex-shrink-0">
           <button
             onClick={handleDownloadJson}
             disabled={!data || loading}
             className={downloadButtonStyle}
             title="Download raw JSON data"
           >
             Download JSON
           </button>
           <button
             onClick={handleDownloadMarkdown}
             disabled={!data || !data.markdown || loading}
             className={downloadButtonStyle}
             title="Download Markdown report"
           >
             Download MD
           </button>
         </div>
      </h2>

      {/* Render markdown with proper styling, including GFM tables */}
      {/* Reverted to simpler prose styling */}
      <div className="
          prose prose-sm dark:prose-invert max-w-none
          bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-auto max-h-96
          text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700
        ">
        {data.markdown ? (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdownContent}</ReactMarkdown>
        ) : (
          <pre>{markdownContent}</pre>
        )}
      </div>
    </div>
  );
};

export default ResultDisplay;
