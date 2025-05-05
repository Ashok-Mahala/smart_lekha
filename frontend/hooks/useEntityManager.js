import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import websocketService from '../services/websocket';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useEntityManager = (entityName, api) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const cacheRef = useRef(new Map());
  const lastFetchRef = useRef(new Map());

  // Initialize WebSocket connection
  useEffect(() => {
    websocketService.connect();

    // Subscribe to real-time updates
    const unsubscribeCreate = websocketService.subscribe(
      entityName,
      'create',
      (newEntity) => {
        setData(prev => [...prev, newEntity]);
        cacheRef.current.clear();
        lastFetchRef.current.clear();
      }
    );

    const unsubscribeUpdate = websocketService.subscribe(
      entityName,
      'update',
      (updatedEntity) => {
        setData(prev => prev.map(entity => 
          entity._id === updatedEntity._id ? updatedEntity : entity
        ));
        cacheRef.current.clear();
        lastFetchRef.current.clear();
      }
    );

    const unsubscribeDelete = websocketService.subscribe(
      entityName,
      'delete',
      (deletedId) => {
        setData(prev => prev.filter(entity => entity._id !== deletedId));
        cacheRef.current.clear();
        lastFetchRef.current.clear();
      }
    );

    const unsubscribeStatus = websocketService.subscribe(
      entityName,
      'status_update',
      (update) => {
        setData(prev => prev.map(entity => 
          entity._id === update.id ? { ...entity, status: update.status } : entity
        ));
        cacheRef.current.clear();
        lastFetchRef.current.clear();
      }
    );

    // Cleanup subscriptions on unmount
    return () => {
      unsubscribeCreate();
      unsubscribeUpdate();
      unsubscribeDelete();
      unsubscribeStatus();
      websocketService.disconnect();
    };
  }, [entityName]);

  const isCacheValid = useCallback((key) => {
    const lastFetch = lastFetchRef.current.get(key);
    if (!lastFetch) return false;
    return Date.now() - lastFetch < CACHE_DURATION;
  }, []);

  const getCacheKey = useCallback((params = {}) => {
    return `${entityName}-${JSON.stringify(params)}`;
  }, [entityName]);

  const fetchData = useCallback(async (params = {}) => {
    const cacheKey = getCacheKey(params);
    
    // Return cached data if valid
    if (isCacheValid(cacheKey)) {
      return cacheRef.current.get(cacheKey);
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.get(params);
      const result = response.data;

      // Update cache
      cacheRef.current.set(cacheKey, result);
      lastFetchRef.current.set(cacheKey, Date.now());

      setData(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api, getCacheKey, isCacheValid]);

  const createEntity = useCallback(async (entityData) => {
    setLoading(true);
    setError(null);

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const optimisticEntity = { ...entityData, _id: tempId };
    setData(prev => [...prev, optimisticEntity]);

    try {
      const response = await api.create(entityData);
      const newEntity = response.data;

      // Update with real data
      setData(prev => prev.map(entity => 
        entity._id === tempId ? newEntity : entity
      ));

      // Invalidate cache
      cacheRef.current.clear();
      lastFetchRef.current.clear();

      toast.success(`${entityName} created successfully`);
      return newEntity;
    } catch (err) {
      // Revert optimistic update
      setData(prev => prev.filter(entity => entity._id !== tempId));
      setError(err);
      toast.error(err.error?.message || `Failed to create ${entityName}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api, entityName]);

  const updateEntity = useCallback(async (id, entityData) => {
    setLoading(true);
    setError(null);

    // Optimistic update
    setData(prev => prev.map(entity => 
      entity._id === id ? { ...entity, ...entityData } : entity
    ));

    try {
      const response = await api.update(id, entityData);
      const updatedEntity = response.data;

      // Update with real data
      setData(prev => prev.map(entity => 
        entity._id === id ? updatedEntity : entity
      ));

      // Invalidate cache
      cacheRef.current.clear();
      lastFetchRef.current.clear();

      toast.success(`${entityName} updated successfully`);
      return updatedEntity;
    } catch (err) {
      // Revert optimistic update
      fetchData();
      setError(err);
      toast.error(err.error?.message || `Failed to update ${entityName}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api, entityName, fetchData]);

  const deleteEntity = useCallback(async (id) => {
    setLoading(true);
    setError(null);

    // Optimistic update
    const deletedEntity = data.find(entity => entity._id === id);
    setData(prev => prev.filter(entity => entity._id !== id));

    try {
      await api.delete(id);

      // Invalidate cache
      cacheRef.current.clear();
      lastFetchRef.current.clear();

      toast.success(`${entityName} deleted successfully`);
      return true;
    } catch (err) {
      // Revert optimistic update
      if (deletedEntity) {
        setData(prev => [...prev, deletedEntity]);
      }
      setError(err);
      toast.error(err.error?.message || `Failed to delete ${entityName}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api, data, entityName]);

  const updateStatus = useCallback(async (id, status) => {
    return updateEntity(id, { status });
  }, [updateEntity]);

  return {
    data,
    loading,
    error,
    fetchData,
    createEntity,
    updateEntity,
    deleteEntity,
    updateStatus,
  };
}; 