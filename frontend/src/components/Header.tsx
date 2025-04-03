import React from 'react';

const Header: React.FC = () => {
  return (
    // Added dark mode styles: dark background, dark border, light text
    <header className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-4 shadow-sm dark:shadow-md border-b border-gray-200 dark:border-gray-700">
      {/* Removed container mx-auto to align with App.tsx max-width */}
      <div className="max-w-6xl mx-auto text-center px-4"> {/* Match main content padding/width */}
        {/* Fancy Title: Gradient text, subtle shadow */}
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-400 dark:to-primary-500 bg-clip-text text-transparent text-shadow-subtle pb-1"> {/* Added gradient, bg-clip, transparent text, shadow, padding-bottom */}
          PRAISE
        </h1>
        {/* Subtitle with adjusted dark mode color */}
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Analyze and Categorize Unstructured Data</p>
      </div>
    </header>
  );
};

export default Header;
