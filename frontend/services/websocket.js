import { toast } from 'sonner';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.subscribers = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
  }

  connect() {
    try {
      // Default to port 5000 to match .env file
      const wsUrl = `${import.meta.env.VITE_WS_URL || 'ws://62.72.58.243:5000'}/ws`;
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.socket.onclose = () => {
        console.log('WebSocket disconnected');
        this.handleReconnect();
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      this.reconnectDelay *= 2; // Exponential backoff
      setTimeout(() => this.connect(), this.reconnectDelay);
    } else {
      toast.error('Lost connection to server. Please refresh the page.');
    }
  }

  handleMessage(data) {
    const { type, entity, action, payload } = data;

    // Handle notifications
    if (type === 'notification') {
      this.handleNotification(payload);
      return;
    }

    // Handle entity updates
    if (type === 'entity_update') {
      const subscribers = this.subscribers.get(`${entity}_${action}`) || [];
      subscribers.forEach(callback => callback(payload));
    }
  }

  handleNotification(notification) {
    const { type, message, title } = notification;
    
    switch (type) {
      case 'success':
        toast.success(message, { description: title });
        break;
      case 'error':
        toast.error(message, { description: title });
        break;
      case 'warning':
        toast.warning(message, { description: title });
        break;
      case 'info':
        toast.info(message, { description: title });
        break;
      default:
        toast(message, { description: title });
    }
  }

  subscribe(entity, action, callback) {
    const key = `${entity}_${action}`;
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, []);
    }
    this.subscribers.get(key).push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(key);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
        if (callbacks.length === 0) {
          this.subscribers.delete(key);
        }
      }
    };
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

// Create a singleton instance
const websocketService = new WebSocketService();

export default websocketService; 