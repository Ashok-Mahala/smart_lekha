import React, { createContext, useContext, useEffect, useState } from 'react';
import websocketService from '../services/websocket';
import { toast } from 'sonner';

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  useEffect(() => {
    const handleConnect = () => {
      setIsConnected(true);
      setConnectionStatus('connected');
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setConnectionStatus('disconnected');
    };

    const handleError = (error) => {
      console.error('WebSocket error:', error);
      setConnectionStatus('error');
      toast.error('Connection error. Please check your internet connection.');
    };

    try {
      // Initialize WebSocket connection
      websocketService.connect();

      // Add event listeners only if socket exists
      if (websocketService.socket) {
        websocketService.socket.addEventListener('open', handleConnect);
        websocketService.socket.addEventListener('close', handleDisconnect);
        websocketService.socket.addEventListener('error', handleError);
      }

      // Cleanup
      return () => {
        if (websocketService.socket) {
          websocketService.socket.removeEventListener('open', handleConnect);
          websocketService.socket.removeEventListener('close', handleDisconnect);
          websocketService.socket.removeEventListener('error', handleError);
          websocketService.disconnect();
        }
      };
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      setConnectionStatus('error');
      return () => {}; // Empty cleanup function
    }
  }, []);

  const value = {
    isConnected,
    connectionStatus,
    subscribe: (entity, action, callback) => {
      try {
        return websocketService.subscribe(entity, action, callback);
      } catch (error) {
        console.error('Failed to subscribe to WebSocket:', error);
        return () => {}; // Return empty unsubscribe function
      }
    },
    disconnect: () => {
      try {
        websocketService.disconnect();
      } catch (error) {
        console.error('Failed to disconnect WebSocket:', error);
      }
    },
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}; 