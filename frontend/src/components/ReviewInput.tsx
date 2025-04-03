import React, { useState, useEffect } from 'react';

interface ReviewInputProps {
  onSubmit: (sellerDescription: string, reviews: string[]) => void;
  initialSellerDescription?: string;
  initialReviews?: string[];
  isLoading?: boolean; // Add isLoading prop
  isDisabled?: boolean; // Add isDisabled prop
}

const ReviewInput: React.FC<ReviewInputProps> = ({
  onSubmit,
  initialSellerDescription = '',
  initialReviews = [],
  isLoading = false, // Destructure isLoading with a default value
  isDisabled = false // Destructure isDisabled with a default value
}) => {
  const [sellerDescription, setSellerDescription] = useState<string>(initialSellerDescription);
  const [reviewsText, setReviewsText] = useState<string>('');

  // Update state when initialValues change
  useEffect(() => {
    setSellerDescription(initialSellerDescription);

    // Convert initial reviews array to text format
    if (initialReviews && initialReviews.length > 0) {
      setReviewsText(initialReviews.join('\n'));
    } else {
      setReviewsText(''); // Clear if initialReviews is empty or undefined
    }
  }, [initialSellerDescription, initialReviews]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return; // Prevent submission if already loading

    console.log("handleSubmit: Initial reviewsText:", JSON.stringify(reviewsText)); // Log initial text

    try {
      let reviews: string[] = [];
      const trimmedText = reviewsText.trim();
      console.log("handleSubmit: trimmedText:", JSON.stringify(trimmedText)); // Log trimmed text

      if (trimmedText.startsWith('[') && trimmedText.endsWith(']')) {
        console.log("handleSubmit: Attempting JSON parse...");
        // Attempt to parse as JSON array
        try {
          let parsedReviews = JSON.parse(trimmedText); // Parse into a temporary variable
          console.log("handleSubmit: JSON parsed successfully. Raw parsedReviews:", JSON.stringify(parsedReviews), "Length:", parsedReviews.length); // Log raw parsed array

          if (!Array.isArray(parsedReviews) || !parsedReviews.every(item => typeof item === 'string')) {
             console.error("handleSubmit: Parsed JSON is not an array of strings.");
             throw new Error("Parsed JSON is not an array of strings.");
          }
          // Trim and filter the parsed array to remove empty/whitespace strings
          reviews = parsedReviews.map(review => review.trim()).filter(review => review !== '');
          console.log("handleSubmit: Reviews after JSON parse, map, filter:", JSON.stringify(reviews), "Length:", reviews.length); // Log filtered array
        } catch (jsonError) {
          // If JSON parsing fails BUT it looked like JSON, show specific error
          console.error("handleSubmit: JSON parsing failed:", jsonError);
          alert("The review input looks like JSON but could not be parsed. Please check the format for errors (e.g., missing commas, incorrect quotes, invalid escape sequences).");
          return; // Stop processing, do not fall back to newline split
          // --- Old fallback logic removed ---
          // console.warn("handleSubmit: JSON parsing failed, falling back to newline split.", jsonError);
          // const splitReviews = trimmedText.split('\n');
          // console.log("handleSubmit: Fallback split:", JSON.stringify(splitReviews), "Length:", splitReviews.length);
          // reviews = splitReviews.map(review => review.trim()).filter(review => review !== '');
          // console.log("handleSubmit: Reviews after fallback split, map, filter:", JSON.stringify(reviews), "Length:", reviews.length);
        }
      } else {
        // Input doesn't start/end with [], treat as multi-line text
        console.log("handleSubmit: Input not detected as JSON array, using newline split...");
        // Treat as multi-line text
        const splitReviews = trimmedText.split('\n'); // Log intermediate step
        console.log("handleSubmit: Newline split:", JSON.stringify(splitReviews), "Length:", splitReviews.length);
        reviews = splitReviews.map(review => review.trim()).filter(review => review !== '');
        console.log("handleSubmit: Reviews after newline split, map, filter:", JSON.stringify(reviews), "Length:", reviews.length); // Log filtered array
      }

      console.log("handleSubmit: Final reviews array before onSubmit:", JSON.stringify(reviews), "Length:", reviews.length); // Log final array

      if (reviews.length === 0 && trimmedText !== '') {
         // Handle case where splitting resulted in empty array but input wasn't empty
         alert("Could not parse reviews. Please ensure format is correct (JSON array or one review per line).");
         return;
      }

      onSubmit(sellerDescription, reviews);
    } catch (error) {
      alert("An error occurred processing reviews. Please check the format (JSON array or one per line) and try again.");
      console.error("Review processing error:", error);
    }
  };

  // Updated styles for textareas and button - Added dark mode variants
  const textareaStyle = "block w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 shadow-sm focus:ring-2 focus:ring-primary focus:border-primary transition duration-150 ease-in-out bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500";
  const buttonStyle = "w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-primary hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-500 dark:focus:ring-offset-gray-800"; // Adjusted dark focus offset

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Seller Description Input */}
      <div>
        <label htmlFor="seller-description" className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1.5">
          Seller Description
        </label>
        <textarea
          id="seller-description"
          className={textareaStyle}
          rows={5}
          value={sellerDescription}
          onChange={(e) => setSellerDescription(e.target.value)}
          placeholder="Enter the seller's product description here"
          required
          disabled={isLoading || isDisabled} // Disable textarea when loading OR component is disabled
        ></textarea>
      </div>

      {/* Reviews Input */}
      <div>
        <label htmlFor="reviews" className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1.5">
          Reviews (as JSON array or one per line)
        </label>
        <textarea
          id="reviews"
          className={textareaStyle}
          rows={8}
          value={reviewsText}
          onChange={(e) => setReviewsText(e.target.value)}
          placeholder={`Example JSON: ["First review", "Second review"]\n\nOr one review per line`}
          required
          disabled={isLoading || isDisabled} // Disable textarea when loading OR component is disabled
        ></textarea>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Tip: Paste a JSON array or type/paste reviews separated by new lines.
        </p>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className={buttonStyle}
        disabled={isLoading || isDisabled || !sellerDescription.trim() || !reviewsText.trim()} // Disable button when loading, component disabled, or inputs are empty
      >
        {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Starting Session...</span>
            </>
          ) : (
            'Start Analysis'
          )}
      </button>
    </form>
  );
};

export default ReviewInput;
