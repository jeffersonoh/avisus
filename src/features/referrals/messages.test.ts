import { describe, expect, it } from "vitest";

import {
  REFERRAL_PRICE_INTEGRITY_MESSAGE,
  REFERRAL_RECOGNIZED_MESSAGE,
  REFERRAL_SIGNUP_USED_MESSAGE,
} from "./messages";

const partnerSensitiveFragments = ["Parceiro Teste", "parceiro@avisus.test", "10%", "12.5%"];
const discountPromiseFragments = ["desconto", "promoção", "preço menor", "abatimento"];

describe("referral user-facing messages", () => {
  it("does not expose partner name, email or commission rate in recognized message", () => {
    for (const fragment of partnerSensitiveFragments) {
      expect(REFERRAL_RECOGNIZED_MESSAGE).not.toContain(fragment);
    }
  });

  it("does not promise a discount in referral messages", () => {
    const messages = [
      REFERRAL_PRICE_INTEGRITY_MESSAGE,
      REFERRAL_RECOGNIZED_MESSAGE,
      REFERRAL_SIGNUP_USED_MESSAGE,
    ];

    for (const message of messages) {
      for (const fragment of discountPromiseFragments) {
        expect(message.toLowerCase()).not.toContain(fragment);
      }
    }
  });
});
