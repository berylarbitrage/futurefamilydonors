import { ELIGIBILITY } from "@/config/eligibility";
import { PARTNER_CLINICS_LINE, SITE, spermComp } from "@/config/site";

export interface FaqItem {
  q: string;
  a: string;
}

export type FaqGroup = "general" | "egg" | "sperm";

const egg = ELIGIBILITY.egg;
const sperm = ELIGIBILITY.sperm;

export const FAQ: Record<FaqGroup, { title: string; items: FaqItem[] }> = {
  general: {
    title: "General Questions",
    items: [
      {
        q: "Who are you, and what do you do?",
        a: `${SITE.brand} recruits and pre-screens egg and sperm donors and matches them with intended-parent families. Medical screening, testing, procedures and sample handling are ${PARTNER_CLINICS_LINE}.`,
      },
      {
        q: "How long does the online pre-screen take?",
        a: "About 3 minutes. We only ask basic questions at this stage — no Social Security number, medical records, or photos.",
      },
      {
        q: "What happens after I submit the pre-screen?",
        a: "You'll see your initial result right away. If you pre-qualify, you continue straight into the full application on our website — your progress is saved after every step, and we also email you a link so you can come back any time. A coordinator will then reach out.",
      },
      {
        q: "Where do you operate?",
        a: `${SITE.serviceArea}. Some programs may require travel, which is arranged and paid for.`,
      },
      {
        q: "Is my information kept private?",
        a: "Yes. Your information is stored securely, is only accessed by our screening team and partner clinics, and is never sold. See our Privacy Policy for details.",
      },
      {
        q: "Is compensation based on my looks, ethnicity, or test scores?",
        a: "No. Compensation is for your time, effort, and commitment to the process. It is never based on personal traits such as appearance, ethnicity, or intelligence.",
      },
      {
        q: "Can I refer a friend?",
        a: `Yes! You earn ${SITE.referralBonus} when someone you refer completes a donation. Visit our Refer a Friend page to get your personal link.`,
      },
      {
        q: "Can I withdraw at any time?",
        a: "Yes. Donation is voluntary, and you can withdraw from the process at any point before a procedure.",
      },
      {
        q: "How do I request deletion of my data?",
        a: `Email ${SITE.contactEmail} with your request. We'll confirm your identity and delete your data, subject to any legal record-keeping requirements.`,
      },
      {
        q: "Do you provide medical advice?",
        a: "No. We can explain the process, but please talk to a licensed physician about any medical questions. Final eligibility is determined by our partner medical providers.",
      },
    ],
  },
  egg: {
    title: "Egg Donation",
    items: [
      {
        q: "What are the basic requirements to be an egg donor?",
        a: `You should be ${egg.minAge}–${egg.maxAge} years old, have a BMI under ${egg.maxBmi}, be a non-smoker, have regular menstrual cycles, and have at least a high school diploma.`,
      },
      {
        q: "How much are egg donors compensated?",
        a: `Compensation is typically ${SITE.eggComp}, paid for your time and commitment. All medical, travel, legal, and insurance costs are covered separately.`,
      },
      {
        q: "How long does the whole process take?",
        a: "From application to retrieval usually takes about 2–4 months. The active medication phase is about 10–14 days, and the full commitment including screening is about 3–6 weeks of appointments.",
      },
      {
        q: "Does egg retrieval hurt?",
        a: "Retrieval is done under light sedation, so most donors feel no pain during the procedure. Mild cramping or bloating afterward is common and usually resolves within a few days. Ask the clinic's physician about what to expect for you.",
      },
      {
        q: "Will donating affect my future fertility?",
        a: "Current medical research has not shown that egg donation reduces future fertility in healthy donors, but every person is different. The clinic's physician will discuss risks with you, and we encourage you to ask questions.",
      },
      {
        q: "Are there medical risks?",
        a: "Like any medical procedure, there are some risks, including ovarian hyperstimulation syndrome (OHSS), reactions to medication, and rare procedural complications. Partner clinics monitor you closely to minimize risk.",
      },
      {
        q: "Can I donate if I'm on birth control?",
        a: "Often yes. Many types of birth control are compatible, though some (like certain implants or shots) may need to be paused. Tell us what you use in the pre-screen.",
      },
      {
        q: "Is egg donation anonymous?",
        a: "Most donations are anonymous, though some intended parents request a known or open-ID arrangement. You'll always know the type of arrangement before agreeing, and it will be spelled out in your legal contract.",
      },
      {
        q: "Do I need to take time off work or school?",
        a: "Most monitoring appointments are early in the morning. You'll need to take the retrieval day off, and possibly the day after.",
      },
      {
        q: "Can I donate more than once?",
        a: "Many donors are eligible to donate again, following clinic guidelines and industry recommendations on the total number of cycles.",
      },
      {
        q: "Who pays for medical costs?",
        a: "All screening, medication, procedures, and related insurance are paid for. You will never pay out of pocket for medical costs related to donation.",
      },
    ],
  },
  sperm: {
    title: "Sperm Donation",
    items: [
      {
        q: "What are the basic requirements to be a sperm donor?",
        a: `You should be ${sperm.minAge}–${sperm.maxAge}, at least ${Math.floor(sperm.minHeightInches / 12)}'${sperm.minHeightInches % 12}" tall, a non-smoker, and currently in college or a graduate.`,
      },
      {
        q: "How does sperm donation work with you?",
        a: "We work like an egg donation agency: you complete a short pre-screen and a full application, talk with a coordinator, and once approved your profile joins our donor database. When a family chooses you, our partner clinic arranges screening and collection.",
      },
      {
        q: "How are sperm donors compensated?",
        a: `${spermComp}. Compensation is paid for your time and commitment once a donation is completed.`,
      },
      {
        q: "How long does it take to get matched?",
        a: "It varies. Some donors are matched within a few weeks of approval; for others it can take several months, depending on what families are looking for. Your coordinator will keep you updated, and you can update your availability at any time.",
      },
      {
        q: "What do I need to do before I'm matched?",
        a: "Just complete your application, a short call with your coordinator, and keep your contact details up to date. There are no clinic visits or samples before a match — medical screening only begins once a family has chosen you.",
      },
      {
        q: "Who performs medical testing and handles samples?",
        a: `Medical screening, testing and sample handling are ${PARTNER_CLINICS_LINE}. ${SITE.brand} handles recruitment, your application and matching.`,
      },
      {
        q: "Why is there a height requirement?",
        a: "Height and education guidelines reflect what intended-parent families ask for. They do not affect compensation.",
      },
      {
        q: "Is sperm donation anonymous?",
        a: "Arrangements vary — some families request an anonymous donor, others a known or open-ID arrangement. You'll always know the arrangement before agreeing, and it will be in your donor agreement.",
      },
      {
        q: "Will I have any legal or financial responsibility for children?",
        a: "Donations are made under a written donor agreement that generally protects donors from parental rights and obligations. Laws vary by location, so the agreement and our partners will explain the details.",
      },
      {
        q: "Can I apply if I live outside the United States?",
        a: "Yes. We work with donors across the U.S. and internationally. Some matches may involve travel, which is arranged and paid for.",
      },
    ],
  },
};

/** The 5 questions shown on the home page. */
export const HOME_FAQ: FaqItem[] = [
  FAQ.general.items[1]!,
  FAQ.egg.items[1]!,
  FAQ.sperm.items[2]!,
  FAQ.egg.items[4]!,
  FAQ.general.items[4]!,
];
