import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, FormGroup } from '@angular/forms';

/** Shape of every error the backend returns (GlobalExceptionHandler.ErrorResponse). */
export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  fieldErrors?: Record<string, string>;
}

function asApiError(err: unknown): ApiError | null {
  if (err instanceof HttpErrorResponse && err.error && typeof err.error === 'object' && 'message' in err.error) {
    return err.error as ApiError;
  }
  return null;
}

/** A user-friendly message for any failed request. */
export function errorMessage(err: unknown, fallback = 'Etwas ist schiefgelaufen.'): string {
  if (err instanceof HttpErrorResponse && err.status === 0) {
    return 'Server nicht erreichbar. Läuft das Backend auf Port 8080?';
  }
  return asApiError(err)?.message ?? fallback;
}

/**
 * Shows backend validation errors directly under the matching form fields.
 * Returns true if at least one field error could be assigned.
 */
export function applyFieldErrors(form: FormGroup, err: unknown): boolean {
  const fieldErrors = asApiError(err)?.fieldErrors;
  if (!fieldErrors) {
    return false;
  }
  let applied = false;
  for (const [field, message] of Object.entries(fieldErrors)) {
    const control: AbstractControl | null = form.get(field);
    if (control) {
      control.setErrors({ ...(control.errors ?? {}), server: message });
      control.markAsTouched();
      applied = true;
    }
  }
  return applied;
}
