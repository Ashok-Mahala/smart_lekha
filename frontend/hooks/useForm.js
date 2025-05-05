import { useState, useCallback } from 'react';
import { validate, sanitizeInput } from '../utils/validation';

export const useForm = (initialValues = {}, validationSchema = null) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle input change with validation
  const handleChange = useCallback((e) => {
    const { name, value, type } = e.target;
    
    // Sanitize input based on field type
    let sanitizedValue = value;
    if (type === 'email') {
      sanitizedValue = sanitizeInput.email(value);
    } else if (type === 'tel') {
      sanitizedValue = sanitizeInput.phone(value);
    } else if (type === 'date') {
      sanitizedValue = sanitizeInput.date(value);
    } else if (type === 'time') {
      sanitizedValue = sanitizeInput.time(value);
    } else if (type === 'text' || type === 'textarea') {
      sanitizedValue = sanitizeInput.text(value);
    }

    // Update values
    setValues(prev => ({
      ...prev,
      [name]: sanitizedValue
    }));

    // Validate field if schema exists
    if (validationSchema) {
      const fieldSchema = validationSchema.shape[name];
      if (fieldSchema) {
        const { isValid, error } = validate.field(fieldSchema, sanitizedValue);
        setErrors(prev => ({
          ...prev,
          [name]: isValid ? null : error
        }));
      }
    }
  }, [validationSchema]);

  // Handle input blur
  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(async (onSubmit) => {
    setIsSubmitting(true);
    setErrors({});

    try {
      // Validate entire form if schema exists
      if (validationSchema) {
        const { isValid, errors: validationErrors } = validate.form(validationSchema, values);
        if (!isValid) {
          setErrors(validationErrors);
          return;
        }
      }

      await onSubmit(values);
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        submit: error.message
      }));
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validationSchema]);

  // Reset form
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  // Set form values
  const setFieldValue = useCallback((name, value) => {
    setValues(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  // Set form error
  const setFieldError = useCallback((name, error) => {
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  }, []);

  // Check if form is valid
  const isValid = Object.keys(errors).length === 0;

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setFieldValue,
    setFieldError,
  };
}; 