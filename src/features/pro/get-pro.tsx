"use client";

import { Check, CreditCard, X } from "lucide-react";
import { useState } from "react";
import { upgradeProfileToPro } from "@/features/profile/profile-service";
import { useProfile } from "@/features/profile/use-profile";
import { emitProAccessChange, useProAccess } from "./pro-access";

type PaymentErrors = Partial<Record<"name" | "number" | "expiry" | "cvc", string>>;

export function GetPro({
  label = "Get Pro",
  className = "button primary",
  showStatus = false,
}: {
  label?: string;
  className?: string;
  showStatus?: boolean;
}) {
  const { isPro } = useProAccess();
  const { profile, refreshProfile } = useProfile();
  const [open, setOpen] = useState(false);
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [errors, setErrors] = useState<PaymentErrors>({});
  const [paymentStatus, setPaymentStatus] = useState(
    "Use test details only. Nothing is charged or stored.",
  );

  async function handleFakePayment() {
    const nextErrors = validatePayment({
      cvc,
      expiry,
      name: cardName,
      number: cardNumber,
    });

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setPaymentStatus("Fix the highlighted fields to continue.");
      return;
    }

    if (!profile) {
      setPaymentStatus("Sign in before starting Pro.");
      return;
    }

    setPaymentStatus("Activating Pro.");

    try {
      await upgradeProfileToPro(profile);
      await refreshProfile();
      emitProAccessChange();
      setOpen(false);
      setPaymentStatus("Pro active. Coach reports and premium skins are unlocked.");
    } catch (error) {
      setPaymentStatus(
        error instanceof Error ? error.message : "Could not activate Pro.",
      );
    }
  }

  return (
    <>
      {isPro ? (
        <div className="payment-success">
          <Check size={18} />
          <span>Fake Pro is active on this browser.</span>
        </div>
      ) : (
        <>
          <button className={className} onClick={() => setOpen(true)} type="button">
            <CreditCard size={18} />
            {label}
          </button>
          {showStatus ? <p className="muted-line">{paymentStatus}</p> : null}
        </>
      )}

      {open ? (
        <div
          className="billing-modal-backdrop"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <form
            aria-label="Fake Pro billing form"
            className="billing-dialog"
            onClick={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault();
              void handleFakePayment();
            }}
          >
            <div className="auth-dialog-head">
              <div>
                <h2>Get Pro</h2>
                <p className="muted-line">$4/mo fake checkout</p>
              </div>
              <button
                aria-label="Close billing form"
                className="button"
                onClick={() => setOpen(false)}
                type="button"
              >
                <X size={18} />
              </button>
            </div>

            <label className="field">
              <span>Name on card</span>
              <input
                aria-invalid={Boolean(errors.name)}
                onChange={(event) => setCardName(event.target.value)}
                placeholder="Test Player"
                value={cardName}
              />
              {errors.name ? <span className="error-line">{errors.name}</span> : null}
            </label>
            <label className="field">
              <span>Card number</span>
              <input
                aria-invalid={Boolean(errors.number)}
                inputMode="numeric"
                onChange={(event) => setCardNumber(formatCardNumber(event.target.value))}
                placeholder="4242 4242 4242 4242"
                value={cardNumber}
              />
              {errors.number ? <span className="error-line">{errors.number}</span> : null}
            </label>
            <div className="payment-row">
              <label className="field">
                <span>Expiry</span>
                <input
                  aria-invalid={Boolean(errors.expiry)}
                  inputMode="numeric"
                  onChange={(event) => setExpiry(formatExpiry(event.target.value))}
                  placeholder="MM/YY"
                  value={expiry}
                />
                {errors.expiry ? <span className="error-line">{errors.expiry}</span> : null}
              </label>
              <label className="field">
                <span>CVC</span>
                <input
                  aria-invalid={Boolean(errors.cvc)}
                  inputMode="numeric"
                  maxLength={4}
                  onChange={(event) =>
                    setCvc(event.target.value.replace(/\D/g, "").slice(0, 4))
                  }
                  placeholder="123"
                  value={cvc}
                />
                {errors.cvc ? <span className="error-line">{errors.cvc}</span> : null}
              </label>
            </div>
            <button className="button primary" type="submit">
              <CreditCard size={18} />
              Start fake Pro
            </button>
            <p className="muted-line">{paymentStatus}</p>
          </form>
        </div>
      ) : null}
    </>
  );
}

function validatePayment({
  cvc,
  expiry,
  name,
  number,
}: {
  cvc: string;
  expiry: string;
  name: string;
  number: string;
}): PaymentErrors {
  const errors: PaymentErrors = {};
  const digits = number.replace(/\D/g, "");

  if (name.trim().length < 2) {
    errors.name = "Enter the name on the card.";
  }

  if (digits.length < 13 || digits.length > 19) {
    errors.number = "Card number must be 13 to 19 digits.";
  }

  if (!isValidExpiry(expiry)) {
    errors.expiry = "Use a future MM/YY date.";
  }

  if (!/^\d{3,4}$/.test(cvc)) {
    errors.cvc = "Use 3 or 4 digits.";
  }

  return errors;
}

function isValidExpiry(value: string) {
  const match = value.match(/^(\d{2})\/(\d{2})$/);
  if (!match) {
    return false;
  }

  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) {
    return false;
  }

  const now = new Date();
  const expiryDate = new Date(year, month, 0, 23, 59, 59);
  return expiryDate >= now;
}

function formatCardNumber(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, "$1 ");
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) {
    return digits;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}
