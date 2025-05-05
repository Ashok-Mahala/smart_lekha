import { z } from 'zod';

// Common validation schemas
export const commonSchemas = {
  id: z.string().min(1, 'ID is required'),
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Name can only contain letters, numbers, spaces, hyphens, and underscores'),
  
  email: z.string()
    .email('Invalid email address')
    .min(5, 'Email must be at least 5 characters')
    .max(100, 'Email must be less than 100 characters'),
  
  phone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number')
    .optional(),
  
  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  
  time: z.string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  
  duration: z.number()
    .min(0.5, 'Duration must be at least 30 minutes')
    .max(24, 'Duration cannot exceed 24 hours'),
  
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']),
  
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
};

// Entity-specific schemas
export const entitySchemas = {
  booking: z.object({
    userId: commonSchemas.id,
    seatId: commonSchemas.id,
    zoneId: commonSchemas.id,
    propertyId: commonSchemas.id,
    date: commonSchemas.date,
    startTime: commonSchemas.time,
    endTime: commonSchemas.time,
    duration: commonSchemas.duration,
    status: commonSchemas.status,
    notes: commonSchemas.description,
  }),

  shift: z.object({
    staffId: commonSchemas.id,
    zoneId: commonSchemas.id,
    date: commonSchemas.date,
    startTime: commonSchemas.time,
    endTime: commonSchemas.time,
    duration: commonSchemas.duration,
    status: z.enum(['scheduled', 'in-progress', 'completed', 'cancelled']),
    notes: commonSchemas.description,
  }),

  user: z.object({
    name: commonSchemas.name,
    email: commonSchemas.email,
    phone: commonSchemas.phone,
    role: z.enum(['admin', 'staff', 'user']),
    status: z.enum(['active', 'inactive', 'suspended']),
  }),
};

// Input sanitization functions
export const sanitizeInput = {
  // Remove HTML tags and special characters
  text: (value) => {
    if (typeof value !== 'string') return '';
    return value
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/[^\w\s\-_]/g, '') // Remove special characters
      .trim();
  },

  // Sanitize email
  email: (value) => {
    if (typeof value !== 'string') return '';
    return value.toLowerCase().trim();
  },

  // Sanitize phone number
  phone: (value) => {
    if (typeof value !== 'string') return '';
    return value.replace(/[^\d+]/g, '');
  },

  // Sanitize date
  date: (value) => {
    if (typeof value !== 'string') return '';
    const date = new Date(value);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  },

  // Sanitize time
  time: (value) => {
    if (typeof value !== 'string') return '';
    const [hours, minutes] = value.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return '';
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return '';
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  },
};

// Validation helper functions
export const validate = {
  // Validate a single field
  field: (schema, value) => {
    try {
      schema.parse(value);
      return { isValid: true, error: null };
    } catch (error) {
      return { isValid: false, error: error.errors[0].message };
    }
  },

  // Validate an entire form
  form: (schema, data) => {
    try {
      schema.parse(data);
      return { isValid: true, errors: null };
    } catch (error) {
      const errors = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { isValid: false, errors };
    }
  },

  // Validate and sanitize a field
  fieldWithSanitization: (schema, value, sanitizer) => {
    const sanitizedValue = sanitizer(value);
    return validate.field(schema, sanitizedValue);
  },
};

// Custom validation rules
export const customRules = {
  // Check if end time is after start time
  isEndTimeAfterStartTime: (startTime, endTime) => {
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    const startTotal = startHours * 60 + startMinutes;
    const endTotal = endHours * 60 + endMinutes;
    
    return endTotal > startTotal;
  },

  // Check if date is in the future
  isFutureDate: (date) => {
    const inputDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return inputDate >= today;
  },

  // Check if time slot is available
  isTimeSlotAvailable: (bookings, date, startTime, endTime, excludeId = null) => {
    return !bookings.some(booking => {
      if (booking._id === excludeId) return false;
      if (booking.date !== date) return false;
      
      const bookingStart = booking.startTime;
      const bookingEnd = booking.endTime;
      
      return (
        (startTime >= bookingStart && startTime < bookingEnd) ||
        (endTime > bookingStart && endTime <= bookingEnd) ||
        (startTime <= bookingStart && endTime >= bookingEnd)
      );
    });
  },
}; 