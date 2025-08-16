import { useState } from 'react';
import { supabase, createFreshClient } from '../lib/supabase';

export default function ApiKeyDebugger() {
  const [debugInfo, setDebugInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runDiagnostics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const client = createFreshClient();
      const results = {};

      // Test 1: Check if table exists
      try {
        const { data, error } = await client
          .from('api_keys')
          .select('id')
          .limit(1);
        
        results.tableExists = !error;
        results.tableError = error?.message || null;
      } catch (err) {
        results.tableExists = false;
        results.tableError = err.message;
      }

      // Test 2: Check schema
      try {
        const { data, error } = await client
          .from('api_keys')
          .select('id, name, key, created_at')
          .limit(1);
        
        results.schemaValid = !error;
        results.schemaError = error?.message || null;
      } catch (err) {
        results.schemaValid = false;
        results.schemaError = err.message;
      }

      // Test 3: Check RPC function
      try {
        const { data, error } = await client.rpc('create_api_key', {
          key_name: 'debug_test',
          key_value: 'sk_debug_' + Date.now()
        });
        
        results.rpcWorks = !error;
        results.rpcError = error?.message || null;
        results.rpcResult = data;
      } catch (err) {
        results.rpcWorks = false;
        results.rpcError = err.message;
      }

      // Test 4: Check user authentication
      try {
        const { data: { user }, error } = await client.auth.getUser();
        results.userAuthenticated = !!user;
        results.userError = error?.message || null;
        results.userId = user?.id || null;
      } catch (err) {
        results.userAuthenticated = false;
        results.userError = err.message;
      }

      setDebugInfo(results);
    } catch (err) {
      setError('Diagnostic failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-4">API Key Debugger</h3>
      
      <button
        onClick={runDiagnostics}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50"
      >
        {loading ? 'Running Diagnostics...' : 'Run Diagnostics'}
      </button>

      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {debugInfo && (
        <div className="mt-4 space-y-3">
          <h4 className="font-medium">Diagnostic Results:</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-white dark:bg-gray-800 border rounded-md">
              <h5 className="font-medium mb-2">Table Status</h5>
              <p className="text-sm">
                <span className={`inline-block w-3 h-3 rounded-full mr-2 ${debugInfo.tableExists ? 'bg-green-500' : 'bg-red-500'}`}></span>
                Table exists: {debugInfo.tableExists ? 'Yes' : 'No'}
              </p>
              {debugInfo.tableError && (
                <p className="text-xs text-red-600 mt-1">{debugInfo.tableError}</p>
              )}
            </div>

            <div className="p-3 bg-white dark:bg-gray-800 border rounded-md">
              <h5 className="font-medium mb-2">Schema Status</h5>
              <p className="text-sm">
                <span className={`inline-block w-3 h-3 rounded-full mr-2 ${debugInfo.schemaValid ? 'bg-green-500' : 'bg-red-500'}`}></span>
                Schema valid: {debugInfo.schemaValid ? 'Yes' : 'No'}
              </p>
              {debugInfo.schemaError && (
                <p className="text-xs text-red-600 mt-1">{debugInfo.schemaError}</p>
              )}
            </div>

            <div className="p-3 bg-white dark:bg-gray-800 border rounded-md">
              <h5 className="font-medium mb-2">RPC Function</h5>
              <p className="text-sm">
                <span className={`inline-block w-3 h-3 rounded-full mr-2 ${debugInfo.rpcWorks ? 'bg-green-500' : 'bg-red-500'}`}></span>
                RPC works: {debugInfo.rpcWorks ? 'Yes' : 'No'}
              </p>
              {debugInfo.rpcError && (
                <p className="text-xs text-red-600 mt-1">{debugInfo.rpcError}</p>
              )}
            </div>

            <div className="p-3 bg-white dark:bg-gray-800 border rounded-md">
              <h5 className="font-medium mb-2">Authentication</h5>
              <p className="text-sm">
                <span className={`inline-block w-3 h-3 rounded-full mr-2 ${debugInfo.userAuthenticated ? 'bg-green-500' : 'bg-red-500'}`}></span>
                User authenticated: {debugInfo.userAuthenticated ? 'Yes' : 'No'}
              </p>
              {debugInfo.userError && (
                <p className="text-xs text-red-600 mt-1">{debugInfo.userError}</p>
              )}
            </div>
          </div>

          {debugInfo.rpcResult && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <h5 className="font-medium mb-2">Test API Key Created:</h5>
              <p className="text-xs font-mono bg-white dark:bg-gray-800 p-2 rounded">
                {debugInfo.rpcResult.key}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 