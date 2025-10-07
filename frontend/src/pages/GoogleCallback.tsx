import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const GoogleCallback = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check if this is a success redirect from backend
        const success = searchParams.get('success');
        const token = searchParams.get('token');
        
        if (success && token) {
          // This is a success redirect from the backend
          // Get user info with the token
          const response = await fetch(`https://dkdrn34xpx.us-east-1.awsapprunner.com/api/auth/me`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error('Failed to get user information');
          }

          const userData = await response.json();
          
          // Send success message to parent window
          if (window.opener) {
            window.opener.postMessage({
              type: 'GOOGLE_AUTH_SUCCESS',
              user: userData,
              access_token: token
            }, window.location.origin);
          }

          setStatus('success');
          setMessage('Authentication successful! You can close this window.');
          
          // Close the popup after a short delay
          setTimeout(() => {
            window.close();
          }, 2000);
          return;
        }

        // Handle OAuth callback with code
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const state = searchParams.get('state');

        if (error) {
          throw new Error(`Google OAuth error: ${error}`);
        }

        if (!code) {
          throw new Error('No authorization code received');
        }

        // Send the code to the backend for processing
        const apiUrl = import.meta.env.VITE_API_URL || "https://dkdrn34xpx.us-east-1.awsapprunner.com/api";
        const response = await fetch(`${apiUrl}/auth/google/callback?code=${code}&state=${state}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Authentication failed');
        }

        const data = await response.json();
        
        // Send success message to parent window
        if (window.opener) {
          window.opener.postMessage({
            type: 'GOOGLE_AUTH_SUCCESS',
            user: data.user,
            access_token: data.access_token
          }, window.location.origin);
        }

        setStatus('success');
        setMessage('Authentication successful! You can close this window.');
        
        // Close the popup after a short delay
        setTimeout(() => {
          window.close();
        }, 2000);

      } catch (error: any) {
        console.error('Google callback error:', error);
        
        // Send error message to parent window
        if (window.opener) {
          window.opener.postMessage({
            type: 'GOOGLE_AUTH_ERROR',
            error: error.message
          }, window.location.origin);
        }

        setStatus('error');
        setMessage(error.message || 'Authentication failed');
        
        // Close the popup after showing error
        setTimeout(() => {
          window.close();
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold mb-2">Authenticating with Google...</h2>
              <p className="text-muted-foreground">Please wait while we process your authentication.</p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <div className="text-green-500 text-6xl mb-4">✓</div>
              <h2 className="text-xl font-semibold mb-2 text-green-600">Success!</h2>
              <p className="text-muted-foreground">{message}</p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <div className="text-red-500 text-6xl mb-4">✗</div>
              <h2 className="text-xl font-semibold mb-2 text-red-600">Error</h2>
              <p className="text-muted-foreground">{message}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoogleCallback;
