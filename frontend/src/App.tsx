import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import ReviewInput from './components/ReviewInput';
import ResultDisplay from './components/ResultDisplay';
import {
  checkHeartbeat,
  startSession, // Use startSession
  extractAttributes,
  matchAttributes,
  categorizeAttributes,
  configureApiKey
} from './services/api';
import { ExtractResponse, MatchResponse, CategorizeResponse } from './types/api'; // Import response types - Corrected Path

const App: React.FC = () => {
  // API Key State
  const [apiKey, setApiKey] = useState<string>('');
  const [apiKeyConfigured, setApiKeyConfigured] = useState<boolean>(false);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [isConfiguring, setIsConfiguring] = useState<boolean>(false);

  // Server & Data State
  const [serverStatus, setServerStatus] = useState<string>('Pending Configuration');
  const [sellerDescription, setSellerDescription] = useState<string>(''); // Keep for re-display if needed
  const [reviews, setReviews] = useState<string[]>([]); // Keep for re-display if needed
  const [sessionId, setSessionId] = useState<string | null>(null); // NEW: Store session ID

  // State to hold results fetched from backend for display
  const [extractedAttributesResult, setExtractedAttributesResult] = useState<ExtractResponse | null>(null); // Store full response
  const [matchedDataResult, setMatchedDataResult] = useState<MatchResponse | null>(null); // Store full response
  const [categorizedDataResult, setCategorizedDataResult] = useState<CategorizeResponse | null>(null); // Store full response

  const [loading, setLoading] = useState<{
    session: boolean; // Added loading state for starting session
    extract: boolean;
    match: boolean;
    categorize: boolean;
  }>({
    session: false,
    extract: false,
    match: false,
    categorize: false
  });

  // activeStep state removed - view is now controlled by apiKeyConfigured and sessionId


  const handleInputSubmit = async (sellerDesc: string, reviewsList: string[]) => {
    if (!apiKeyConfigured) {
      alert("Please configure the API key first.");
      return;
    }
    setLoading(prev => ({ ...prev, session: true }));
    setSellerDescription(sellerDesc); // Store input locally for potential display/resubmit
    setReviews(reviewsList);
    setSessionId(null); // Reset session ID for new input
    setExtractedAttributesResult(null); // Reset results
    setMatchedDataResult(null);
    setCategorizedDataResult(null);
    // setActiveStep removed

    try {
      const sessionResponse = await startSession({ seller_description: sellerDesc, reviews: reviewsList });
      setSessionId(sessionResponse.session_id);
      // setActiveStep removed
      console.log("Session started:", sessionResponse.session_id);
    } catch (error: any) {
      console.error('Failed to start session:', error);
      alert(`Failed to start session: ${error.response?.data?.detail || error.message}. Please check console.`);
      // setActiveStep removed
    } finally {
      setLoading(prev => ({ ...prev, session: false }));
    }
  };

  const handleConfigureClick = async () => {
    if (!apiKey) {
      setApiKeyError("API Key cannot be empty.");
      return;
    }
    setIsConfiguring(true);
    setApiKeyError(null);
    setServerStatus("Configuring...");
    // setActiveStep removed
    setSessionId(null); // Reset session on reconfigure
    setExtractedAttributesResult(null);
    setMatchedDataResult(null);
    setCategorizedDataResult(null);

    try {
      await configureApiKey(apiKey);
      setApiKeyConfigured(true);
      setServerStatus("Checking Heartbeat...");
      try {
        const heartbeatResponse = await checkHeartbeat();
        if (heartbeatResponse.status && heartbeatResponse.status.toLowerCase().includes('success')) {
           setServerStatus('Online');
           // setActiveStep removed
        } else {
           setServerStatus(heartbeatResponse.status || 'Heartbeat Failed');
           setApiKeyConfigured(false);
           setApiKeyError("Heartbeat check failed after configuration.");
           // setActiveStep removed
        }
      } catch (heartbeatError: any) {
        setServerStatus('Offline (Heartbeat Failed)');
        setApiKeyConfigured(false);
        setApiKeyError(`Heartbeat check failed: ${heartbeatError.response?.data?.detail || heartbeatError.message}`);
        console.error('Heartbeat check failed:', heartbeatError);
        // setActiveStep removed
      }
    } catch (configError: any) {
      setApiKeyConfigured(false);
      setServerStatus('Configuration Failed');
      setApiKeyError(`Configuration failed: ${configError.response?.data?.detail || configError.message}`);
      console.error('API Key configuration failed:', configError);
      // setActiveStep removed
    } finally {
      setIsConfiguring(false);
    }
  };


  const handleExtractClick = async () => {
    if (!apiKeyConfigured || !sessionId) {
       alert("Please configure API key, ensure server is online, and submit input first.");
       return;
    }
    try {
      setLoading(prev => ({ ...prev, extract: true }));
      // Pass only the session_id
      const result = await extractAttributes({ session_id: sessionId });
      setExtractedAttributesResult(result); // Store the full result object
      // setActiveStep removed
    } catch (error: any) {
      console.error('Extraction failed:', error);
      alert(`Failed to extract attributes: ${error.response?.data?.detail || error.message}. Please check the console.`);
    } finally {
      setLoading(prev => ({ ...prev, extract: false }));
    }
  };

  const handleMatchClick = async () => {
    if (!apiKeyConfigured || !sessionId) {
       alert("Please configure API key, ensure server is online, and start extraction first.");
       return;
    }
    // No need to check extractedAttributesResult locally, backend handles sequence
    try {
      setLoading(prev => ({ ...prev, match: true }));
      // Pass only the session_id
      const result = await matchAttributes({ session_id: sessionId });
      setMatchedDataResult(result); // Store the full result object
      // setActiveStep removed
    } catch (error: any) {
      console.error('Matching failed:', error);
      alert(`Failed to match attributes: ${error.response?.data?.detail || error.message}. Please check the console.`);
    } finally {
      setLoading(prev => ({ ...prev, match: false }));
    }
  };

  const handleCategorizeClick = async () => {
    if (!apiKeyConfigured || !sessionId) {
       alert("Please configure API key, ensure server is online, and start matching first.");
       return;
    }
    // No need to check matchedDataResult locally, backend handles sequence
    try {
      setLoading(prev => ({ ...prev, categorize: true }));
      // Pass only the session_id
      const result = await categorizeAttributes({ session_id: sessionId });
      setCategorizedDataResult(result); // Store the full result object
      // setActiveStep removed
    } catch (error: any) {
      console.error('Categorization failed:', error);
      alert(`Failed to categorize attributes: ${error.response?.data?.detail || error.message}. Please check the console.`);
    } finally {
      setLoading(prev => ({ ...prev, categorize: false }));
    }
  };

  // getStepStyle function removed as activeStep is no longer used




  // Helper for button style - Added dark mode variants, gradient, and blur effect
  const buttonStyle = "inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed button-gradient interactive-blur dark:focus:ring-offset-gray-900"; // Added button-gradient, interactive-blur, removed specific bg/hover colors

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Changed 'container' to 'max-w-6xl' for centered, constrained width */}
      <main className="flex-grow max-w-6xl mx-auto px-4 py-12 w-full"> {/* Added w-full */}
        <div className="mb-6 text-right">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            serverStatus === 'Online'
              ? 'bg-success/10 text-success dark:bg-success/20 dark:text-green-400'
              : (serverStatus.includes('Failed') || serverStatus === 'Offline' || serverStatus.includes('Error'))
              ? 'bg-error/10 text-error dark:bg-error/20 dark:text-red-400'
              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
          }`}>
            <span className={`mr-1.5 h-2 w-2 rounded-full ${
              serverStatus === 'Online' ? 'bg-success dark:bg-green-400'
              : (serverStatus.includes('Failed') || serverStatus === 'Offline' || serverStatus.includes('Error')) ? 'bg-error dark:bg-red-400'
              : 'bg-yellow-500 dark:bg-yellow-400'
            }`}></span>
            Server: {serverStatus}
          </span>
        </div>

        {/* Configuration Section - Always Visible */}
        <section className="mb-10 rounded-xl shadow-md dark:shadow-lg p-8 animate-fade-in section-gradient-light section-gradient-dark">
          <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-gray-100">Configure API Key</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Gemini API Key
              </label>
              <input
                type="password"
                id="apiKey"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100"
                placeholder="Enter your Gemini API Key"
                disabled={isConfiguring}
              />
            </div>
            {apiKeyError && (
              <p className="text-sm text-error dark:text-red-400">{apiKeyError}</p>
            )}
            <button
              onClick={handleConfigureClick}
              disabled={isConfiguring || !apiKey}
              className={buttonStyle}
            >
              {isConfiguring ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Configuring...</span>
                </>
              ) : (
                'Configure & Check Server'
              )}
            </button>
          </div>
        </section>

        {/* Input Section - Visible only when API Key is configured */}
        {apiKeyConfigured && (
          <section className="mb-10 rounded-xl shadow-md dark:shadow-lg p-8 animate-fade-in section-gradient-light section-gradient-dark">
            <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-gray-100">Input Information</h2>
            <ReviewInput
              onSubmit={handleInputSubmit}
              initialSellerDescription={sellerDescription}
              initialReviews={reviews}
              isLoading={loading.session} // Pass loading state to disable submit button
              isDisabled={!apiKeyConfigured} // Disable if API key not configured
            />
             {loading.session && <p className="mt-4 text-primary dark:text-primary-400">Starting analysis session...</p>}
          </section>
        )}

        {/* Processing Steps Container - Visible only when API Key is configured and session started */}
        {apiKeyConfigured && sessionId && (
          <div className="space-y-10">

            {/* Step 1: Extract */}
            <section className="rounded-xl shadow-md dark:shadow-lg p-8 animate-fade-in section-gradient-light section-gradient-dark">
              <div className="flex items-center mb-5">
                {/* Step indicator removed */}
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">1. Extract Attributes from Reviews</h2>
              </div>

              {/* Button always visible if section is rendered, disabled based on loading state */}
               <div className="mb-6">
                 <p className="mb-4 text-gray-700 dark:text-gray-300">Extract factual details from product reviews for this session.</p>
                 <button
                   onClick={handleExtractClick}
                   disabled={loading.extract || !!extractedAttributesResult} // Disable if loading or already extracted
                   className={buttonStyle}
                 >
                   {loading.extract ? (
                     <>
                       <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                       </svg>
                       <span>Extracting...</span>
                     </>
                   ) : extractedAttributesResult ? (
                      'Extraction Complete'
                   ) : (
                     'Start Extraction'
                   )}
                 </button>
               </div>

              {/* Show results if available or loading */}
              {loading.extract || extractedAttributesResult ? (
                <ResultDisplay
                  title="Extracted Attributes"
                  data={extractedAttributesResult}
                  loading={loading.extract && !extractedAttributesResult}
                  stepName="extract" // Pass stepName
                />
              ) : null}
            </section>

            {/* Step 2: Match */}
            {/* Render this section only if extraction is done or in progress */}
            {(loading.extract || extractedAttributesResult) && (
              <section className="rounded-xl shadow-md dark:shadow-lg p-8 animate-fade-in section-gradient-light section-gradient-dark">
                <div className="flex items-center mb-5">
                  {/* Step indicator removed */}
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">2. Match with Seller Description</h2>
                </div>

                {/* Button always visible if section is rendered, disabled based on loading state or previous step */}
                <div className="mb-6">
                  <p className="mb-4 text-gray-700 dark:text-gray-300">Match extracted attributes with the seller's description for this session.</p>
                  <button
                    onClick={handleMatchClick}
                    disabled={loading.match || !extractedAttributesResult || !!matchedDataResult} // Disable if loading, extraction not done, or already matched
                    className={buttonStyle}
                  >
                    {loading.match ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Matching...</span>
                      </>
                    ) : matchedDataResult ? (
                       'Matching Complete'
                    ) : (
                      'Start Matching'
                    )}
                  </button>
                </div>

                {/* Show results if available or loading */}
                {loading.match || matchedDataResult ? (
                  <ResultDisplay
                    title="Matched Attributes"
                    data={matchedDataResult}
                    loading={loading.match && !matchedDataResult}
                    stepName="match" // Pass stepName
                  />
                 ) : null}
              </section>
            )}

            {/* Step 3: Categorize */}
            {/* Render this section only if matching is done or in progress */}
            {(loading.match || matchedDataResult) && (
              <section className="rounded-xl shadow-md dark:shadow-lg p-8 animate-fade-in section-gradient-light section-gradient-dark">
                <div className="flex items-center mb-5">
                  {/* Step indicator removed */}
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">3. Categorize Attributes</h2>
                </div>

                {/* Button always visible if section is rendered, disabled based on loading state or previous step */}
                <div className="mb-6">
                  <p className="mb-4 text-gray-700 dark:text-gray-300">Group attributes into logical categories for this session.</p>
                  <button
                    onClick={handleCategorizeClick}
                    disabled={loading.categorize || !matchedDataResult || !!categorizedDataResult} // Disable if loading, matching not done, or already categorized
                    className={buttonStyle}
                  >
                    {loading.categorize ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Categorizing...</span>
                      </>
                    ) : categorizedDataResult ? (
                       'Categorization Complete'
                    ) : (
                      'Start Categorization'
                    )}
                  </button>
                </div>

                 {/* Show results if available or loading */}
                 {loading.categorize || categorizedDataResult ? (
                  <ResultDisplay
                    title="Categorized Results"
                    data={categorizedDataResult}
                    loading={loading.categorize && !categorizedDataResult}
                    stepName="categorize" // Pass stepName
                  />
                 ) : null}
              </section>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default App;
