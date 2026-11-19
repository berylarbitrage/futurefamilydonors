import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { render } from "@react-email/components";
import EligibleEmail from "@/emails/eligible";
import IneligibleEmail from "@/emails/ineligible";
import DeclinedEmail from "@/emails/declined";
import AdminNewApplicationEmail from "@/emails/admin-new-application";
import { prescreenSummary } from "@/lib/admin/prescreen-summary";

describe("email templates", () => {
  it("eligible email contains the portal link", async () => {
    const html = await render(
      createElement(EligibleEmail, {
        firstName: "Jane",
        donorType: "egg",
        portalUrl: "https://x.com/auth/confirm?t=1",
      }),
    );
    expect(html).toMatch(/Great news, (<!-- -->)?Jane/);
    expect(html).toContain("https://x.com/auth/confirm?t=1");
  });

  it("confirmation for a pre-screen that missed the guidelines never declines", async () => {
    const text = await render(createElement(IneligibleEmail, { firstName: "Jane" }), {
      plainText: true,
    });
    expect(text).toContain("received your application");
    expect(text).toContain("review your answers personally");
    expect(text).not.toMatch(/not able to move forward|can.t move forward/i);
  });

  it("decline email (sent only by staff) has the referral link and spacing", async () => {
    const text = await render(
      createElement(DeclinedEmail, { firstName: "Jane", referUrl: "https://x.com/refer" }),
      { plainText: true },
    );
    expect(text).toContain("not able to move forward");
    expect(text).toContain("https://x.com/refer");
    expect(text).toMatch(/\$500 when/);
  });

  it("admin email lists every pre-screen answer plus the admin link", async () => {
    const details = prescreenSummary(
      {
        donor_type: "egg",
        first_name: "Jane",
        last_name: "Doe",
        email: "jane@example.com",
        phone: "3125550199",
        sms_consent: true,
        date_of_birth: "2000-05-01",
        country: "United States",
        state: "IL",
        zip: "60601",
        region: null,
        city: null,
        postal_code: null,
        education: "Bachelor's",
        how_heard: "Friend",
        height_in: 66,
        weight_lb: 130,
        bmi: 21,
        smoker: false,
        previous_donation: true,
        regular_cycles: true,
        birth_control: "None",
        eligible: false,
        fail_reasons: ["bmi"],
        referral_code: "ABCD1234",
        prescreen_details: {
          schools: [{ name: "University of Chicago", level: "Bachelor's degree" }],
          occupation: "Nursing student",
          aboutMe: "I love hiking.",
          previousDonation: {
            count: 1,
            donations: [{ date: "2024-03-15", eggsRetrieved: "18" }],
            pregnancyKnown: "unknown",
            agencyOrClinic: "Sample Clinic",
          },
        },
      },
      { photos: 3, video: true },
      new Date("2026-11-19T00:00:00Z"),
    );
    const text = await render(
      createElement(AdminNewApplicationEmail, {
        name: "Jane Doe",
        donorType: "egg",
        eligible: false,
        adminUrl: "https://x.com/admin/applications/1",
        details,
      }),
      { plainText: true },
    );
    for (const part of [
      "jane@example.com",
      "3125550199",
      "60601",
      "age 26",
      "University of Chicago (Bachelor's degree)",
      "Nursing student",
      "I love hiking.",
      "5'6\"",
      "130 lb",
      "2024-03-15 · eggs retrieved: 18",
      "Sample Clinic",
      "BMI outside the program range",
      "3 selected + 1 video",
      "ABCD1234",
      "https://x.com/admin/applications/1",
    ]) {
      expect(text).toContain(part);
    }
  });
});
