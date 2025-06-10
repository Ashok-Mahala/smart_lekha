import { useQuery, useMutation } from '@tanstack/react-query';
import axiosInstance from '@/smlekha/axios';
import PropTypes from 'prop-types';
import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { showErrorToast, handleFormErrors } from '@/lib/errorHandler';

export const apiOptionsPropTypes = PropTypes.shape({
  queryKey: PropTypes.array.isRequired,
  queryFn: PropTypes.func.isRequired,
  enabled: PropTypes.bool,
  retry: PropTypes.number,
  retryDelay: PropTypes.number,
  staleTime: PropTypes.number,
  cacheTime: PropTypes.number,
  refetchOnMount: PropTypes.bool,
  refetchOnWindowFocus: PropTypes.bool,
  refetchOnReconnect: PropTypes.bool,
  refetchInterval: PropTypes.number,
  refetchIntervalInBackground: PropTypes.bool,
  onSuccess: PropTypes.func,
  onError: PropTypes.func,
  onSettled: PropTypes.func,
  suspense: PropTypes.bool,
  select: PropTypes.func,
  keepPreviousData: PropTypes.bool
});

export const mutationOptionsPropTypes = PropTypes.shape({
  mutationFn: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
  onError: PropTypes.func,
  onSettled: PropTypes.func,
  retry: PropTypes.number,
  retryDelay: PropTypes.number,
  networkMode: PropTypes.oneOf(['online', 'always', 'offlineFirst']),
  cacheTime: PropTypes.number,
  mutationKey: PropTypes.array,
  meta: PropTypes.object
});

/**
 * Custom hook that uses React Query's useQuery for data fetching
 * 
 * @param {string|Array} key - Query key (string or array)
 * @param {Function|string} queryFnOrUrl - Either a query function or API URL
 * @param {Object} options - React Query options
 * @returns {Object} - React Query result
 */
export function useApiQuery(key, queryFnOrUrl, options = {}) {
  const queryKey = Array.isArray(key) ? key : [key];
  
  let queryFn;
  if (typeof queryFnOrUrl === 'function') {
    queryFn = queryFnOrUrl;
  } else {
    queryFn = async () => {
      const response = await axiosInstance.get(queryFnOrUrl, options.params ? { params: options.params } : undefined);
      return response.data;
    };
  }
  
  return useQuery({
    queryKey,
    queryFn,
    ...options,
    onError: (error) => {
      if (options.showToast !== false) {
        showErrorToast(error);
      }
      if (options.onError) {
        options.onError(error);
      }
    }
  });
}

/**
 * Custom hook for POST mutations using React Query
 * 
 * @param {string} url - API URL
 * @param {Object} options - Mutation options
 * @returns {Object} - React Query mutation result
 */
export function useApiMutation(url, options = {}) {
  return useMutation({
    mutationFn: async (data) => {
      const response = await axiosInstance.post(url, data);
      return response.data;
    },
    onError: (error) => {
      if (options.showToast !== false) {
        showErrorToast(error);
      }
      if (options.form) {
        handleFormErrors(error, options.form);
      }
      if (options.onError) {
        options.onError(error);
      }
    },
    ...options,
  });
}

/**
 * Custom hook for PUT mutations using React Query
 * 
 * @param {string} url - API URL (can include :id placeholder)
 * @param {Object} options - Mutation options
 * @returns {Object} - React Query mutation result
 */
export function useApiPutMutation(url, options = {}) {
  return useMutation({
    mutationFn: async (data) => {
      // Replace :id in URL with id from data
      let targetUrl = url;
      if (url.includes(':id') && data.id) {
        targetUrl = url.replace(':id', data.id);
      }
      
      const response = await axiosInstance.put(targetUrl, data);
      return response.data;
    },
    onError: (error) => {
      if (options.showToast !== false) {
        showErrorToast(error);
      }
      if (options.form) {
        handleFormErrors(error, options.form);
      }
      if (options.onError) {
        options.onError(error);
      }
    },
    ...options,
  });
}

/**
 * Custom hook for DELETE mutations using React Query
 * 
 * @param {string} url - API URL (can include :id placeholder)
 * @param {Object} options - Mutation options
 * @returns {Object} - React Query mutation result
 */
export function useApiDeleteMutation(url, options = {}) {
  return useMutation({
    mutationFn: async (id) => {
      // If id is provided directly, replace :id in URL
      let targetUrl = url;
      if (url.includes(':id') && id) {
        targetUrl = url.replace(':id', id);
      }
      
      const response = await axiosInstance.delete(targetUrl);
      return response.data;
    },
    onError: (error) => {
      if (options.showToast !== false) {
        showErrorToast(error);
      }
      if (options.onError) {
        options.onError(error);
      }
    },
    ...options,
  });
}

/**
 * Custom hook to handle API calls with loading state and error handling
 * 
 * @param {Function} apiFunction - The API function to call
 * @param {Object} options - Additional options
 * @returns {Object} - The loading state, error, call function, and reset function
 */
export const useApi = (apiFunction, options = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  
  const { 
    onSuccess, 
    onError, 
    form,
    showToast = true,
    resetOnCall = true,
    autoCall = false,
    params = null
  } = options;
  
  const reset = useCallback(() => {
    setError(null);
    setData(null);
  }, []);
  
  /**
   * Execute the API call with automatic error handling
   * @param  {...any} args - Arguments to pass to the API function
   * @returns {Promise} - The result of the API call
   */
  const call = useCallback(async (...args) => {
    if (resetOnCall) {
      reset();
    }
    
    setIsLoading(true);
    
    try {
      // Pass the form for field-level errors if provided
      const apiOptions = form ? { form, showToast } : { showToast };
      
      // Execute the API call, passing any arguments
      const result = await apiFunction(...args, apiOptions);
      
      setData(result);
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (err) {
      setError(err);
      
      if (onError) {
        onError(err);
      }
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [apiFunction, form, onSuccess, onError, resetOnCall, reset, showToast]);
  
  // Auto-call the API function if requested
  useEffect(() => {
    if (autoCall) {
      call(params);
    }
  }, [autoCall, call, params]);
  
  return { isLoading, error, data, call, reset };
};

/**
 * Custom hook for handling form submissions with API integration
 * 
 * @param {Function} apiFunction - API function to call for form submission
 * @param {Object} form - The form object from react-hook-form
 * @param {Object} options - Additional options
 * @returns {Object} - The form submit handler and loading state
 */
export const useFormSubmit = (apiFunction, form, options = {}) => {
  const { 
    onSuccess,
    onError,
    resetForm = false,
    showToast = true
  } = options;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  
  const handleSubmit = useCallback(async (formData) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const result = await apiFunction(formData, {
        form,
        showToast
      });
      
      setData(result);
      
      if (resetForm) {
        form.reset();
      }
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (error) {
      setError(error);
      
      // Field errors are already handled by withErrorHandling
      if (onError) {
        onError(error);
      }
      
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [apiFunction, form, onSuccess, onError, resetForm, showToast]);
  
  return { 
    handleSubmit: form.handleSubmit(handleSubmit),
    isSubmitting,
    error,
    data
  };
};

export default useApi; 