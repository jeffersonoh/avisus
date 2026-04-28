"use client";

import { useId, useState } from "react";

import {
  REFERRAL_PRICE_INTEGRITY_MESSAGE,
  REFERRAL_RECOGNIZED_MESSAGE,
} from "./messages";
import { normalizeReferralCode } from "./schemas";

type ReferralCodeFieldProps = {
  id?: string;
  name?: string;
  initialValue?: string;
  error?: string;
};

export function ReferralCodeField({
  id,
  name = "referralCode",
  initialValue = "",
  error,
}: ReferralCodeFieldProps) {
  const generatedId = useId();
  const inputId = id ?? `referral-code-${generatedId}`;
  const descriptionId = `${inputId}-description`;
  const feedbackId = `${inputId}-feedback`;
  const initialCode = normalizeOptionalReferralCode(initialValue);
  const [value, setValue] = useState(initialCode);
  const showRecognized = value.length > 0 && value === initialCode && !error;

  return (
    <div>
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-text-2">
        Cupom de parceiro
      </label>
      <input
        id={inputId}
        name={name}
        type="text"
        inputMode="text"
        autoComplete="off"
        value={value}
        onChange={(event) => setValue(normalizeOptionalReferralCode(event.currentTarget.value))}
        aria-describedby={`${descriptionId}${error || showRecognized ? ` ${feedbackId}` : ""}`}
        aria-invalid={Boolean(error)}
        className="w-full rounded-xl border border-border bg-bg px-4 py-3 font-mono text-sm uppercase tracking-[0.08em] text-text-1 outline-none ring-accent-light/40 transition placeholder:font-body placeholder:normal-case placeholder:tracking-normal focus:ring-2"
        placeholder="PARCEIRO_AVISUS"
      />
      <p id={descriptionId} className="mt-1.5 text-xs leading-relaxed text-text-3">
        {REFERRAL_PRICE_INTEGRITY_MESSAGE}
      </p>
      {error ? (
        <p id={feedbackId} className="mt-1.5 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      {showRecognized ? (
        <p id={feedbackId} className="mt-1.5 text-sm text-success" role="status">
          {REFERRAL_RECOGNIZED_MESSAGE}
        </p>
      ) : null}
    </div>
  );
}

function normalizeOptionalReferralCode(input: string): string {
  return input.trim().length > 0 ? normalizeReferralCode(input) : "";
}
