import { ELIGIBILITY } from "@/config/eligibility";
import { PARTNER_CLINICS_LINE, SITE } from "@/config/site";

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
  a: "About 3 minutes. Basic stuff plus 3–5 photos of yourself. No Social Security number, no medical records.",
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
  a: "Your compensation depends on how you're matched. If your eggs are matched through an egg bank, you'll typically receive $8,000 – $10,000 per cycle. If you're matched directly with a family, compensation starts at $10,000 per cycle. Experienced donors receive higher compensation than first-time donors. Compensation is paid for your time and commitment, and all medical, travel, legal and insurance costs are covered on top of that.",
};
const EGG_REQ: FaqItem = {
  q: "Can I be an egg donor?",
  a: `Most of our donors are ${egg.minAge}–${egg.maxAge}, have a BMI under ${egg.maxBmi}, don't smoke or vape, have regular cycles, have no significant medical conditions, and are currently in college or have a college degree. Not sure you qualify? Take our 3-minute pre-screen to find out. Final eligibility is confirmed by our partner clinic.`,
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
  a: "Probably some, so plan ahead. Donation is a real commitment. If you live near the clinic, most monitoring appointments are early in the morning, and you should take retrieval day and the day after off. If you're a travel donor, plan to be away for about 7–14 days around stimulation and retrieval. Your coordinator will give you a schedule in advance so you can arrange time off from work or school.",
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
  a: "Yes, many donors do! If your first cycle goes well and the clinic clears you medically, you can donate again. Following American Society for Reproductive Medicine (ASRM) guidelines, we limit donors to a maximum of six donation cycles. Experienced donors also receive higher compensation.",
};

/* ---- Sperm ---------------------------------------------------------------- */
const SPERM_PAY: FaqItem = {
  q: "What do sperm donors get paid?",
  a: "You're paid for each completed donation, and the amount depends on the program. Usually, from $3,000 and up to $20,000. Compensation is for your time and commitment, and all medical screening and testing is covered at no cost to you. Your coordinator will explain the exact amount before you sign your donor agreement.",
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
  a: `Most of our donors are ${sperm.minAge}–${sperm.maxAge}, at least ${Math.floor(sperm.minHeightInches / 12)}'${sperm.minHeightInches % 12}" tall, have a BMI under ${sperm.maxBmi}, don't smoke or vape, and are currently in college or have a college degree. Not sure you qualify? Take our 3-minute pre-screen to find out. Final eligibility is confirmed by our partner clinic.`,
};
const SPERM_INTL: FaqItem = {
  q: "I live outside the U.S. Can I apply?",
  a: "Yes! We work with donors across the U.S. and internationally. If you live outside the U.S., you'll need a valid U.S. visa to donate here. If a match involves travel, we arrange it and cover the cost.",
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
  q: "Why are there height and education requirements?",
  a: "These guidelines reflect what intended parents most often look for when choosing a donor, so they help your profile get matched. They're about matching only, and they don't affect your compensation.",
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
