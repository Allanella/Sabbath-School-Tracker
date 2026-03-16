import React, { useState } from 'react';
import { Search, User, X, AlertCircle } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

console.log('🔍 DEBUG - API_URL loaded:', API_URL);
console.log('🔍 DEBUG - Environment:', import.meta.env.MODE);

const MemberSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      setError('Please enter a member name to search');
      return;
    }

    setLoading(true);
    setError('');
    setSearchResults([]);
    setSearched(false);

    try {
      console.log('=== MEMBER SEARCH DEBUG ===');
      console.log('Searching for:', searchQuery);
      console.log('API_URL constant:', API_URL);
      console.log('Full URL being called:', `${API_URL}/members/search`);
      console.log('Token exists:', !!localStorage.getItem('token'));
      console.log('Token preview:', localStorage.getItem('token')?.substring(0, 20) + '...');
      
      const response = await axios.get(`${API_URL}/members/search`, {
        params: { query: searchQuery.trim() },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      console.log('Full response:', response);
      console.log('Response data:', response.data);
      
      // Extract results - handle multiple possible response structures
      let results = [];
      
      if (response.data) {
        if (Array.isArray(response.data)) {
          // Direct array
          results = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          // Nested in data property
          results = response.data.data;
        } else if (response.data.members && Array.isArray(response.data.members)) {
          // Nested in members property
          results = response.data.members;
        } else if (typeof response.data === 'object' && !Array.isArray(response.data)) {
          // Single object - wrap in array
          results = [response.data];
        }
      }
      
      console.log('Extracted results:', results);
      console.log('Results is array:', Array.isArray(results));
      console.log('Results count:', results.length);
      
      setSearchResults(results);
      setSearched(true);
      
    } catch (err) {
      console.error('=== SEARCH ERROR ===');
      console.error('Error object:', err);
      console.error('Error response:', err.response);
      console.error('Error status:', err.response?.status);
      console.error('Error data:', err.response?.data);
      
      const errorMessage = err.response?.data?.message 
        || err.response?.data?.error
        || err.message
        || 'Failed to search. Please try again.';
      
      setError(errorMessage);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setError('');
    setSearched(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Member Search</h1>
        <p className="text-gray-600">Search for members across all classes</p>
      </div>

      {/* Debug Info Banner */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-800 font-mono">
          🔍 Debug: API_URL = {API_URL}
        </p>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <form onSubmit={handleSearch}>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter member name..."
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
              />
            </div>
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                title="Clear search"
              >
                <X className="h-5 w-5" />
              </button>
            )}
            <button
              type="submit"
              disabled={loading || !searchQuery.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Searching members...</p>
        </div>
      )}

      {/* No Results */}
      {searched && !loading && searchResults.length === 0 && !error && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No members found</h3>
          <p className="text-gray-600">
            No members matching "{searchQuery}" were found. Try a different search term.
          </p>
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && !loading && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              Found {searchResults.length} member{searchResults.length > 1 ? 's' : ''}
            </h2>
          </div>
          <div className="divide-y">
            {searchResults.map((member, index) => (
              <div
                key={member.member_id || member.id || index}
                className="p-6 hover:bg-gray-50 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <User className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {member.member_name || member.name || 'Unknown Member'}
                      </h3>
                      <div className="mt-1 space-y-1">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Class:</span> {member.class_name || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Teacher:</span> {member.teacher_name || 'N/A'}
                        </p>
                        {member.quarter_name && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Quarter:</span> {member.quarter_name} {member.quarter_year}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    Active
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberSearch;