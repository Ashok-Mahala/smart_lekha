import { useState, useCallback } from 'react';
import { toast } from 'sonner';

const useMutation = (mutationFn) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...params) => {
    try {
      setLoading(true);
      setError(null);
      const response = await mutationFn(...params);
      return response;
    } catch (err) {
      const errorMessage = err.error?.message || 'An error occurred';
      setError(err.error);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [mutationFn]);

  return {
    loading,
    error,
    execute
  };
};

export default useMutation; 