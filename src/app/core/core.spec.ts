import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup } from '@angular/forms';
import { fileUrl } from './api';
import { avatarTone, initials, matchesSearch } from './format';
import { applyFieldErrors, errorMessage } from './http-error';

describe('format helpers', () => {
  it('builds initials from first and last name', () => {
    expect(initials('Max', 'Mustermann')).toBe('MM');
    expect(initials('Max Mustermann')).toBe('MM');
    expect(initials('')).toBe('');
  });

  it('gives the same name always the same avatar colour', () => {
    expect(avatarTone('Omar')).toBe(avatarTone('Omar'));
  });

  it('searches case-insensitively across fields', () => {
    expect(matchesSearch('wald', 'Waldhonig')).toBe(true);
    expect(matchesSearch('raps', 'Waldhonig', null)).toBe(false);
    expect(matchesSearch('  ', 'anything')).toBe(true);
  });

  it('turns backend file paths into absolute URLs', () => {
    expect(fileUrl('/receipts/a.pdf')).toBe('http://localhost:8080/receipts/a.pdf');
    expect(fileUrl(null)).toBeNull();
  });
});

describe('http-error helpers', () => {
  const apiError = (body: object, status = 400) => new HttpErrorResponse({ error: body, status });

  it('reads the backend message', () => {
    expect(errorMessage(apiError({ message: 'Nicht genug Bestand' }))).toBe('Nicht genug Bestand');
  });

  it('explains when the backend is not running', () => {
    expect(errorMessage(new HttpErrorResponse({ status: 0 }))).toContain('Server nicht erreichbar');
  });

  it('puts backend field errors on the matching form controls', () => {
    const form = new FormGroup({ email: new FormControl('x') });

    const applied = applyFieldErrors(form, apiError({ message: 'Validation failed', fieldErrors: { email: 'Invalid email format' } }));

    expect(applied).toBe(true);
    expect(form.controls.email.errors?.['server']).toBe('Invalid email format');
  });
});
