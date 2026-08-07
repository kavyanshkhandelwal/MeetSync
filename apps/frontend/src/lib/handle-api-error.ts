import { FieldValues, Path, UseFormSetError } from 'react-hook-form';

interface ApiError {
  response?: {
    data?: {
      message?: string;
      errors?: Array<{
        path: string;
        msg: string;
      }>;
    };
  };
}

export function handleApiError<T extends FieldValues>(
  err: unknown,
  setError: UseFormSetError<T>,
  setGeneralError?: (message: string) => void
): void {
  const error = err as ApiError;
  
  // Extract backend validation errors
  const backendErrors = error.response?.data?.errors;
  
  if (backendErrors && Array.isArray(backendErrors)) {
    // Set field-specific errors
    backendErrors.forEach((fieldError) => {
      const fieldName = fieldError.path as Path<T>;
      setError(fieldName, {
        type: 'server',
        message: fieldError.msg,
      });
    });
    
    // Set general error message if provided
    if (setGeneralError && error.response?.data?.message) {
      setGeneralError(error.response.data.message);
    }
  } else {
    // Handle general errors (non-validation errors)
    const message = error.response?.data?.message || 'An error occurred';
    if (setGeneralError) {
      setGeneralError(message);
    }
    setError('root' as Path<T>, {
      type: 'server',
      message,
    });
  }
}
