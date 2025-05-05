import { z } from 'zod';

// Common validation patterns
export const PATTERNS = {
  PHONE: /^\d{10}$/,
  PINCODE: /^\d{6}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
};

// Auth validation schemas
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Email is required' })
    .email({ message: 'Must be a valid email address' }),
  password: z
    .string()
    .min(1, { message: 'Password is required' })
    .min(8, { message: 'Password must be at least 8 characters' }),
});

export const signupSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Name is required' })
    .min(2, { message: 'Name must be at least 2 characters' }),
  email: z
    .string()
    .min(1, { message: 'Email is required' })
    .email({ message: 'Must be a valid email address' }),
  password: z
    .string()
    .min(1, { message: 'Password is required' })
    .min(8, { message: 'Password must be at least 8 characters' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' }),
  confirmPassword: z
    .string()
    .min(1, { message: 'Please confirm your password' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Student schema
export const studentSchema = z.object({
  // Personal Information
  name: z
    .string()
    .min(1, { message: 'Name is required' })
    .min(2, { message: 'Name must be at least 2 characters' }),
  fatherName: z
    .string()
    .min(1, { message: 'Father\'s name is required' }),
  dateOfBirth: z
    .date()
    .refine((date) => date <= new Date(), { message: 'Date of birth cannot be in the future' }),
  gender: z
    .string()
    .min(1, { message: 'Gender is required' }),
  
  // Academic Information
  studentId: z
    .string()
    .min(1, { message: 'Student ID is required' }),
  admissionDate: z
    .date(),
  course: z
    .string()
    .min(1, { message: 'Course is required' }),
  shift: z
    .string()
    .min(1, { message: 'Shift is required' }),
  seatNo: z
    .string()
    .min(1, { message: 'Seat number is required' }),
  
  // Contact Information
  email: z
    .string()
    .min(1, { message: 'Email is required' })
    .email({ message: 'Must be a valid email address' }),
  phone: z
    .string()
    .min(1, { message: 'Phone number is required' })
    .regex(PATTERNS.PHONE, { message: 'Phone number must be 10 digits' }),
  whatsapp: z
    .string()
    .regex(PATTERNS.PHONE, { message: 'WhatsApp number must be 10 digits' })
    .optional()
    .or(z.literal('')),
  address: z
    .string()
    .min(1, { message: 'Address is required' }),
  city: z
    .string()
    .min(1, { message: 'City is required' }),
  state: z
    .string()
    .min(1, { message: 'State is required' }),
  pincode: z
    .string()
    .min(1, { message: 'Pincode is required' })
    .regex(PATTERNS.PINCODE, { message: 'Pincode must be 6 digits' }),
  
  // Identification
  idProofType: z
    .string()
    .min(1, { message: 'ID proof type is required' }),
  idProofNumber: z
    .string()
    .min(1, { message: 'ID proof number is required' }),
  
  // Additional Information
  status: z
    .string()
    .min(1, { message: 'Status is required' }),
  notes: z
    .string()
    .optional(),
});

// Booking schema
export const bookingSchema = z.object({
  studentId: z
    .string()
    .min(1, { message: 'Student is required' }),
  seatId: z
    .string()
    .min(1, { message: 'Seat is required' }),
  startDate: z
    .date()
    .refine((date) => date >= new Date(new Date().setHours(0, 0, 0, 0)), { 
      message: 'Start date cannot be in the past' 
    }),
  endDate: z
    .date(),
  plan: z
    .string()
    .min(1, { message: 'Plan is required' }),
  amount: z
    .number()
    .min(0, { message: 'Amount must be at least 0' }),
  paymentStatus: z
    .string()
    .min(1, { message: 'Payment status is required' }),
  notes: z
    .string()
    .optional(),
}).refine((data) => data.endDate > data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
});

// Payment schema
export const paymentSchema = z.object({
  studentId: z
    .string()
    .min(1, { message: 'Student is required' }),
  amount: z
    .number()
    .min(1, { message: 'Amount must be at least 1' }),
  paymentDate: z
    .date(),
  paymentMethod: z
    .string()
    .min(1, { message: 'Payment method is required' }),
  paymentReference: z
    .string()
    .optional(),
  category: z
    .string()
    .min(1, { message: 'Category is required' }),
  notes: z
    .string()
    .optional(),
});

// Seat schema
export const seatSchema = z.object({
  seatNumber: z
    .string()
    .min(1, { message: 'Seat number is required' }),
  section: z
    .string()
    .min(1, { message: 'Section is required' }),
  type: z
    .string()
    .min(1, { message: 'Seat type is required' }),
  status: z
    .string()
    .min(1, { message: 'Status is required' }),
  price: z
    .number()
    .min(0, { message: 'Price must be at least 0' }),
  description: z
    .string()
    .optional(),
});

// Export all schemas
export const schemas = {
  login: loginSchema,
  signup: signupSchema,
  student: studentSchema,
  booking: bookingSchema,
  payment: paymentSchema,
  seat: seatSchema,
}; 