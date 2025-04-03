import React from 'react';

const Footer: React.FC = () => {
  return (
    // Added dark mode styles: dark background, dark border, adjusted text colors
    <footer className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 p-4 border-t border-gray-200 dark:border-gray-700 mt-12">
      <div className="container mx-auto text-center">
        {/* Adjusted text color */}
        <p className="text-sm"> Product Review Attribute Insight Structuring Engine</p>
        {/* Adjusted text color and size */}
      </div>
    </footer>
  );
};

export default Footer;
