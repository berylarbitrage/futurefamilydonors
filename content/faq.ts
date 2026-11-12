import { ELIGIBILITY } from "@/config/eligibility";
import { PARTNER_CLINICS_LINE, SITE, spermComp } from "@/config/site";

export interface FaqItem {
  q: string;
  a: string;
}

export type FaqGroup = "general" | "egg" | "sperm";

const egg = ELIGIBILITY.egg;
const sperm = ELIGIBILITY.sperm;

/* ---- The basics ---------------------------------------------------------- */
const PRESCREEN: FaqItem = {
  q: "How long is the pre-screen, really?",
  a: "About 3 minutes. Basic stuff only. No Social Security number, no medical records, no photos.",
};
const AFTER: FaqItem = {
  q: "I hit submit. Now what?",
  a: "You get your first result on the spot. Pre-qualify? Keep going straight into the full application on our site. Every step saves automatically, and we email you a link so you can pick up later. Then a coordinator reaches out.",
};
const PRIVACY: FaqItem = {
  q: "Who sees my info?",
  a: "Only our screening team and our partner clinics. It's stored securely and never sold. Details are in our Privacy Policy.",
};
const WHERE: FaqItem = {
  q: "Do I have to live in the U.S.?",
  a: `Nope. ${SITE.serviceArea}. If a program needs you to travel, the travel is arranged and paid for.`,
};
const WHO: FaqItem = {
  q: "So what exactly do you do?",
  a: `We find donors, pre-screen them and match them with intended-parent families. The medical side — screening, testing, procedures and sample handling — is ${PARTNER_CLINICS_LINE}.`,
};
const TRAITS: FaqItem = {
  q: "Does my pay depend on my looks or grades?",
  a: "No. Never. You're paid for your time, effort and commitment — not for appearance, ethnicity or intelligence.",
};
const WITHDRAW: FaqItem = {
  q: "Can I change my mind?",
  a: "Yes. Donating is voluntary. You can step out at any point before a procedure.",
};
const DELETE: FaqItem = {
  q: "How do I get my data deleted?",
  a: `Email ${SITE.contactEmail}. We confirm it's you, then delete your data — except anything the law says we must keep.`,
};
const NO_ADVICE: FaqItem = {
  q: "Can you give me medical advice?",
  a: "No. We'll walk you through the process, but medical questions go to a licensed physician. Final eligibility is decided by our partner medical providers.",
};
const REFER: FaqItem = {
  q: "Can I send a friend your way?",
  a: `Please do. You earn ${SITE.referralBonus} when someone you refer completes a donation. Grab your personal link on the Refer a Friend page.`,
};

/* ---- Egg ------------------------------------------------------------------ */
const EGG_PAY: FaqItem = {
  q: "What do egg donors get paid?",
  a: `Typically ${SITE.eggComp}, for your time and commitment. Medical, travel, legal and insurance costs are covered on top of that.`,
};
const EGG_REQ: FaqItem = {
  q: "Can I be an egg donor?",
  a: `Quick check: ${egg.minAge}–${egg.maxAge} years old, BMI under ${egg.maxBmi}, non-smoker, regular cycles, and at least a high school diploma.`,
};
const EGG_FERTILITY: FaqItem = {
  q: "Will it mess with my own fertility later?",
  a: "Current research hasn't shown that egg donation lowers future fertility in healthy donors. But everyone's different — the clinic's physician will go through the risks with you. Ask anything.",
};
const EGG_HURT: FaqItem = {
  q: "Does retrieval hurt?",
  a: "You're under light sedation, so most donors feel nothing during it. Some cramping or bloating afterward is common and usually gone in a few days. The clinic's physician can tell you what to expect.",
};
const EGG_RISKS: FaqItem = {
  q: "What are the medical risks?",
  a: "Like any procedure, there are some: ovarian hyperstimulation syndrome (OHSS), reactions to medication and rare procedural complications. Partner clinics monitor you closely to keep risk low.",
};
const EGG_TIME: FaqItem = {
  q: "How long does the whole thing take?",
  a: "Usually about 2–4 months from application to retrieval. Medication runs about 10–14 days. All in, expect about 3–6 weeks of appointments, screening included.",
};
const EGG_COSTS: FaqItem = {
  q: "Do I pay for anything medical?",
  a: "No. Screening, medication, procedures and related insurance are all paid for. Zero out of pocket.",
};
const EGG_WORK: FaqItem = {
  q: "Will I miss work or class?",
  a: "Most monitoring appointments are early morning. Plan to take retrieval day off — maybe the day after too.",
};
const EGG_BC: FaqItem = {
  q: "I'm on birth control. Problem?",
  a: "Often not. Many types are fine; some (like certain implants or shots) may need a pause. Just tell us what you use in the pre-screen.",
};
const EGG_ANON: FaqItem = {
  q: "Will I stay anonymous?",
  a: "Usually, yes. Some intended parents ask for a known or open-ID arrangement. You'll always know which one before you agree, and it's written into your legal contract.",
};
const EGG_AGAIN: FaqItem = {
  q: "Can I donate again?",
  a: "Many donors can, within clinic guidelines and industry recommendations on total cycles.",
};

/* ---- Sperm ---------------------------------------------------------------- */
const SPERM_PAY: FaqItem = {
  q: "What do sperm donors get paid?",
  a: `${spermComp}. It's paid for your time and commitment once a donation is completed.`,
};
const SPERM_HOW: FaqItem = {
  q: "How does this work with you?",
  a: "Like an egg donation agency. Pre-screen, full application, a chat with your coordinator. Once approved, your profile joins our donor database. When a family picks you, our partner clinic sets up screening and collection.",
};
const SPERM_BEFORE: FaqItem = {
  q: "What do I do before I'm matched?",
  a: "Not much. Finish your application, have a short call with your coordinator, and keep your contact details current. No clinic visits, no samples — medical screening only starts once a family chooses you.",
};
const SPERM_WAIT: FaqItem = {
  q: "How long until I'm matched?",
  a: "It depends on what families are looking for. Some donors match within a few weeks of approval; for others it takes several months. Your coordinator keeps you posted, and you can update your availability any time.",
};
const SPERM_TESTING: FaqItem = {
  q: "Who handles the medical testing?",
  a: `Not us. Medical screening, testing and sample handling are ${PARTNER_CLINICS_LINE}. ${SITE.brand} handles recruitment, your application and matching.`,
};
const SPERM_REQ: FaqItem = {
  q: "Can I be a sperm donor?",
  a: `Quick check: ${sperm.minAge}–${sperm.maxAge} years old, at least ${Math.floor(sperm.minHeightInches / 12)}'${sperm.minHeightInches % 12}" tall, non-smoker, and in college or a graduate.`,
};
const SPERM_INTL: FaqItem = {
  q: "I live outside the U.S. Can I apply?",
  a: "Yes. We work with donors across the U.S. and internationally. If a match involves travel, it's arranged and paid for.",
};
const SPERM_LEGAL: FaqItem = {
  q: "Am I on the hook for any kids, legally or financially?",
  a: "Donations happen under a written donor agreement that generally protects donors from parental rights and obligations. Laws vary by location, so the agreement and our partners spell out the details.",
};
const SPERM_ANON: FaqItem = {
  q: "Will I stay anonymous?",
  a: "Depends on the family. Some want an anonymous donor, others a known or open-ID arrangement. You'll always know which before you agree, and it goes in your donor agreement.",
};
const SPERM_HEIGHT: FaqItem = {
  q: "Why the height rule?",
  a: "Height and education guidelines reflect what intended-parent families ask for. They don't change your compensation.",
};

export const FAQ: Record<FaqGroup, { title: string; items: FaqItem[] }> = {
  general: {
    title: "The Basics",
    items: [PRESCREEN, AFTER, WHO, WHERE, TRAITS, PRIVACY, WITHDRAW, DELETE, NO_ADVICE, REFER],
  },
  egg: {
    title: "Egg Donation",
    items: [
      EGG_PAY,
      EGG_REQ,
      EGG_TIME,
      EGG_COSTS,
      EGG_HURT,
      EGG_RISKS,
      EGG_FERTILITY,
      EGG_WORK,
      EGG_BC,
      EGG_ANON,
      EGG_AGAIN,
    ],
  },
  sperm: {
    title: "Sperm Donation",
    items: [
      SPERM_PAY,
      SPERM_HOW,
      SPERM_REQ,
      SPERM_BEFORE,
      SPERM_WAIT,
      SPERM_TESTING,
      SPERM_INTL,
      SPERM_ANON,
      SPERM_LEGAL,
      SPERM_HEIGHT,
    ],
  },
};

/** The 5 questions shown on the home page. */
export const HOME_FAQ: FaqItem[] = [PRESCREEN, EGG_PAY, SPERM_PAY, AFTER, PRIVACY];
