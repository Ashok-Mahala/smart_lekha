import React, { useState, useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { WebSocketProvider } from './contexts/WebSocketContext';
import { router } from './router';
import './App.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("App crashed:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-container" style={{ 
          padding: '20px', 
          maxWidth: '800px', 
          margin: '0 auto', 
          textAlign: 'center',
          marginTop: '100px'
        }}>
          <h1>Something went wrong</h1>
          <p>The application couldn't load properly. Please try refreshing the page.</p>
          <details style={{ marginTop: '20px', textAlign: 'left' }}>
            <summary>Error details (for developers)</summary>
            <pre style={{ 
              padding: '10px', 
              background: '#f5f5f5', 
              borderRadius: '5px',
              overflow: 'auto'
            }}>
              {this.state.error && this.state.error.toString()}
            </pre>
          </details>
          <button 
            onClick={() => window.location.reload()} 
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              background: '#4a90e2',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const App = () => {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    // Wait a bit to ensure everything is initialized
    const timer = setTimeout(() => {
      setAppReady(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  if (!appReady) {
    return <div>Loading application...</div>;
  }

  return (
    <ErrorBoundary>
      <WebSocketProvider>
        <RouterProvider router={router} />
        <Toaster position="top-right" />
      </WebSocketProvider>
    </ErrorBoundary>
  );
};

export default App;
