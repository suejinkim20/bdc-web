/**
 * MultiSelectCheckbox
 *
 * Renders a USWDS checkbox group for multi-select fields backed by
 * reference data from a Freshdesk custom object schema.
 *
 * Used for fields where the user can select one or more options from a
 * predefined list — for example, Research Community, Research Area,
 * and Org Contribution on the Publications Submission form.
 *
 * Options source:
 *   Options are fetched at build time via getReferenceDataValues() and passed
 *   as a string array prop. They are never fetched client-side.
 *
 * Payload shape:
 *   React Hook Form returns checked checkbox values as an array of strings.
 *   This maps directly to the MULTI_SELECT field type in Freshdesk custom
 *   objects, which expects an array of string values.
 *   buildCustomObjectPayload handles this automatically.
 *
 * "Other" free text:
 *   Not yet implemented. When "Other" is checked, a free text input should
 *   appear below the checkbox group. This will be added alongside the
 *   RadioField "Other" implementation for consistency.
 *   The free text field name convention is: `other_{fieldName}`
 *   e.g. for `research_community` → `other_research_community`
 *
 * Uses raw USWDS CSS classes, consistent with the project pattern of using
 * Trussworks only when a component requires complex JS behavior.
 */

import type { FieldError, UseFormRegister } from 'react-hook-form';

interface MultiSelectCheckboxProps {
  // The field name — used as the HTML input name and RHF registration key.
  // Also used to generate unique input IDs for each option.
  name: string;
  // The customer-facing label for the checkbox group.
  label: string;
  // Optional hint text shown below the label, above the checkboxes.
  hint?: string;
  // Whether at least one option must be checked before submitting.
  required?: boolean;
  // The available options for this checkbox group.
  // Fetched at build time via getReferenceDataValues() from a reference
  // data custom object schema (e.g. ResearchCommunities).
  // Each string is both the display label and the submitted value.
  options: string[];
  // React Hook Form's register function, bound to this field by the parent.
  // Note: RHF automatically collects checked checkbox values as an array
  // when multiple checkboxes share the same name.
  register: ReturnType<UseFormRegister<Record<string, unknown>>>;
  // The React Hook Form error for this field, if any.
  error?: FieldError;
}

export default function MultiSelectCheckbox({
  name,
  label,
  hint,
  required = false,
  options,
  register,
  error,
}: MultiSelectCheckboxProps) {
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
        <div key={option} className="usa-checkbox">
          <input
            // Each checkbox needs a unique ID — combine field name and
            // a slugified version of the option value to avoid collisions
            // when multiple checkbox groups exist on the same page.
            id={`${name}-${option.toLowerCase().replace(/\s+/g, '-')}`}
            className="usa-checkbox__input"
            type="checkbox"
            value={option}
            aria-required={required}
            {...register}
          />
          <label
            className="usa-checkbox__label"
            htmlFor={`${name}-${option.toLowerCase().replace(/\s+/g, '-')}`}
          >
            {option}
          </label>
        </div>
      ))}
    </fieldset>
  );
}
