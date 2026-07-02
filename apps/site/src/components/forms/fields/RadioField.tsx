/**
 * RadioField
 *
 * Renders a USWDS radio button group for single-select fields backed by
 * reference data from a Freshdesk custom object schema.
 *
 * Used for fields where the user must pick exactly one option from a
 * predefined list — for example, Publication Status (Published, Preprint, Other).
 *
 * Options source:
 *   Options are fetched at build time via getReferenceDataValues() and passed
 *   as a string array prop. They are never fetched client-side.
 *
 * "Other" free text:
 *   Not yet implemented. When "Other" is selected, a free text input should
 *   appear below the radio group. This will be added alongside the
 *   CheckboxGroupField "Other" implementation for consistency.
 *   The free text field name convention is: `other_{fieldName}`
 *   e.g. for `publication_status` → `other_publication_status`
 *
 * Uses raw USWDS CSS classes, consistent with the project pattern of using
 * Trussworks only when a component requires complex JS behavior.
 */

import type { FieldError, UseFormRegister } from 'react-hook-form';

interface RadioFieldProps {
  // The field name — used as the HTML input name and RHF registration key.
  // Also used to generate unique input IDs for each option.
  name: string;
  // The customer-facing label for the radio group.
  label: string;
  // Optional hint text shown below the label, above the radio options.
  hint?: string;
  // Whether at least one option must be selected before submitting.
  required?: boolean;
  // The available options for this radio group.
  // Fetched at build time via getReferenceDataValues() from a reference
  // data custom object schema (e.g. PublicationStatus).
  // Each string is both the display label and the submitted value.
  options: string[];
  // React Hook Form's register function, bound to this field by the parent.
  register: ReturnType<UseFormRegister<Record<string, unknown>>>;
  // The React Hook Form error for this field, if any.
  error?: FieldError;
}

export default function RadioField({
  name,
  label,
  hint,
  required = false,
  options,
  register,
  error,
}: RadioFieldProps) {
  const hintId = hint ? `${name}-hint` : undefined;
  const errorId = error ? `${name}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <fieldset
      className={`usa-fieldset${error ? ' usa-form-group--error' : ''}`}
      aria-describedby={describedBy}
    >
      <legend className="usa-legend">
        {label}
        {required && (
          <abbr title="required" className="usa-hint usa-hint--required">
            {' '}
            *
          </abbr>
        )}
      </legend>

      {hint && (
        <span id={hintId} className="usa-hint">
          {hint}
        </span>
      )}

      {error && (
        <span id={errorId} className="usa-error-message" role="alert">
          {error.message}
        </span>
      )}

      {options.map((option) => (
        <div key={option} className="usa-radio">
          <input
            // Each radio input needs a unique ID — combine field name and
            // a slugified version of the option value to avoid collisions
            // when multiple radio groups exist on the same page.
            id={`${name}-${option.toLowerCase().replace(/\s+/g, '-')}`}
            className="usa-radio__input"
            type="radio"
            value={option}
            {...register}
          />
          <label
            className="usa-radio__label"
            htmlFor={`${name}-${option.toLowerCase().replace(/\s+/g, '-')}`}
          >
            {option}
          </label>
        </div>
      ))}
    </fieldset>
  );
}
