import { useState } from "react";
import { z } from "zod";

// Validation schemas
export const phoneSchema = z
  .string()
  .min(10, "Phone number must be at least 10 digits")
  .max(15, "Phone number cannot exceed 15 digits")
  .regex(/^[\d\s\-\(\)\+\.]+$/, "Invalid phone number format");

export const vinSchema = z
  .string()
  .length(17, "VIN must be exactly 17 characters")
  .regex(/^[A-HJ-NPR-Z0-9]+$/i, "Invalid VIN format");

export const zipCodeSchema = z
  .string()
  .regex(/^\d{5}(-\d{4})?$/, "ZIP code must be 5 or 9 digits");

export const stateSchema = z
  .string()
  .length(2, "State must be 2 characters")
  .regex(/^[A-Z]{2}$/, "State must be uppercase letters");

// Address validation schema
export const addressSchema = z.object({
  street: z
    .string()
    .min(1, "Street address is required")
    .max(100, "Street address too long"),
  city: z.string().min(1, "City is required").max(50, "City name too long"),
  state: stateSchema,
  zip: zipCodeSchema,
});

// Enhanced form validation hook
export const useFormValidation = <T extends Record<string, any>>(
  schema: z.ZodSchema<T>,
) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);

  const validateField = (name: string, value: any) => {
    try {
      // Validate specific field
      const fieldSchema = (schema as any).shape[name];
      if (fieldSchema) {
        fieldSchema.parse(value);
        setErrors((prev) => ({ ...prev, [name]: "" }));
        return true;
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors((prev) => ({ ...prev, [name]: error.errors[0].message }));
        return false;
      }
    }
    return true;
  };

  const validateForm = async (
    data: T,
  ): Promise<{ success: boolean; errors: Record<string, string> }> => {
    setIsValidating(true);
    try {
      await schema.parseAsync(data);
      setErrors({});
      return { success: true, errors: {} };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMap: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errorMap[err.path[0] as string] = err.message;
          }
        });
        setErrors(errorMap);
        return { success: false, errors: errorMap };
      }
      return { success: false, errors: { general: "Validation failed" } };
    } finally {
      setIsValidating(false);
    }
  };

  const clearErrors = () => setErrors({});

  return {
    errors,
    isValidating,
    validateField,
    validateForm,
    clearErrors,
    hasErrors: Object.keys(errors).length > 0,
  };
};

// Phone number formatting utility
export const formatPhoneNumber = (value: string): string => {
  const cleaned = value.replace(/\D/g, "");
  if (cleaned.length >= 10) {
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})(\d*)$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}${match[4] ? ` ext ${match[4]}` : ""}`;
    }
  }
  return value;
};

// State abbreviation formatting
export const formatState = (value: string): string => {
  return value.toUpperCase().slice(0, 2);
};

// ZIP code formatting
export const formatZipCode = (value: string): string => {
  const cleaned = value.replace(/\D/g, "");
  if (cleaned.length > 5) {
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 9)}`;
  }
  return cleaned;
};
