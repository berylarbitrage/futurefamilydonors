/**
 * Full (stage 2) application: section definitions. The portal form, the
 * server validation and the admin detail view are all generated from this.
 */
import { z } from "zod";
import type { DonorType } from "@/config/eligibility";

export type FieldKind = "text" | "textarea" | "select" | "yesno" | "multi" | "number" | "grid";

/** One column of a "grid" question (e.g. Height, Eye color). */
export interface GridColumn {
  key: string;
  label: string;
  kind: "text" | "select";
  options?: readonly string[];
  max?: number;
  placeholder?: string;
}
/** One row of a "grid" question (e.g. Mother). Required rows need every column. */
export interface GridRow {
  key: string;
  label: string;
  required?: boolean;
}

export interface FieldDef {
  name: string;
  label: string;
  kind: FieldKind;
  options?: readonly string[];
  required?: boolean;
  hint?: string;
  min?: number;
  max?: number;
  onlyFor?: DonorType;
  /** Follow-up question: only shown (and only required) when this condition holds. */
  showIf?: ShowIf;
  /** "grid" questions: one row per person, one column per detail. */
  rows?: readonly GridRow[];
  columns?: readonly GridColumn[];
  /** "school": a type-ahead over the world universities list (free text still allowed). */
  widget?: "school";
  /** Could identify the donor (school, birthplace): never shown in the anonymous catalog. */
  identifying?: boolean;
  /**
   * No longer asked. Kept so answers given before the change still show for
   * staff; not rendered, validated or required.
   */
  retired?: boolean;
}

export type ShowIf =
  | { field: string; equals: string } // e.g. a Yes/No answer is "Yes"
  | { field: string; anyExcept: string } // multi-select has an option other than "None of these"
  | { field: string; gt: number } // number answer is greater than N
  | { fields: readonly string[]; anyExcept: string } // any of these multi-selects has a real answer
  | { field: string; filled: true }; // the other answer is not empty

export interface FormSectionDef {
  id: FormSectionId;
  title: string;
  description: string;
  fields: FieldDef[];
}

export const FORM_SECTION_IDS = [
  "background",
  "education",
  "appearance",
  "medical",
  "family",
  "reproductive",
] as const;
export type FormSectionId = (typeof FORM_SECTION_IDS)[number];
export const ALL_SECTION_IDS = [...FORM_SECTION_IDS, "photos", "signature"] as const;
export type SectionId = (typeof ALL_SECTION_IDS)[number];

export const SECTION_TITLES: Record<SectionId, string> = {
  background: "Personal background",
  education: "Education & career",
  appearance: "Physical characteristics",
  medical: "Personal medical history",
  family: "Family medical history",
  reproductive: "Reproductive health",
  photos: "Photos",
  signature: "Review & sign",
};

const YES_NO_NA = ["Yes", "No"] as const;
const NONE = "None of these";
const PERSONAL_CONDITIONS = [
  "Asthma",
  "Diabetes",
  "Heart condition",
  "High blood pressure",
  "Cancer",
  "Seizures / epilepsy",
  "Depression or anxiety",
  "Bipolar disorder",
  "Schizophrenia",
  "ADHD",
  "Autoimmune disorder",
  "Thyroid disorder",
  "Sexually transmitted infection",
  "Genetic or inherited condition",
  "Other condition not listed here",
  "None of these",
] as const;
const FAMILY_CONDITIONS = [
  "Heart disease before age 55",
  "Diabetes",
  "Cancer",
  "Alzheimer's / dementia",
  "Mental illness",
  "Substance use disorder",
  "Birth defects",
  "Genetic disorder (e.g. cystic fibrosis, sickle cell, Tay-Sachs)",
  "Intellectual disability",
  "Hearing or vision loss before age 50",
  "Other condition not listed here",
  "None of these",
] as const;

const EYE_COLORS = ["Black", "Brown", "Hazel", "Green", "Blue", "Gray", "Other"] as const;
const HAIR_COLORS = [
  "Black",
  "Dark brown",
  "Light brown",
  "Blonde",
  "Red",
  "Gray",
  "Other",
] as const;
const RACES = [
  "White / Caucasian",
  "Hispanic / Latino",
  "Black / African American",
  "Asian",
  "American Indian or Alaska Native",
  "Native Hawaiian or Other Pacific Islander",
  "Middle Eastern / North African",
  "Other",
] as const;
const EDUCATION_LEVELS = [
  "Less than high school",
  "High school / GED",
  "Some college",
  "Associate degree",
  "Bachelor's degree",
  "Master's degree",
  "Doctorate / professional degree",
  "Trade / vocational",
  "Unknown",
] as const;

const HEIGHTS = [
  ...Array.from({ length: 37 }, (_, i) => {
    const total = 48 + i; // 4'0" to 7'0"
    return `${Math.floor(total / 12)}'${total % 12}"`;
  }),
  "Unknown",
];
const AGES = ["Unknown", ...Array.from({ length: 110 }, (_, i) => String(i + 1))];
const ETHNICITIES = [
  "English / British",
  "Irish",
  "Scottish / Welsh",
  "German",
  "Italian",
  "French",
  "Dutch / Belgian",
  "Polish",
  "Scandinavian",
  "Russian / Ukrainian",
  "Other Eastern European",
  "Greek",
  "Spanish / Portuguese",
  "Other European",
  "Jewish (Ashkenazi)",
  "Jewish (Sephardic / Mizrahi)",
  "Mexican",
  "Puerto Rican",
  "Cuban",
  "Dominican",
  "Central American",
  "South American",
  "African American",
  "West African",
  "East African",
  "Other African",
  "Caribbean",
  "Middle Eastern",
  "North African",
  "Chinese",
  "Taiwanese",
  "Japanese",
  "Korean",
  "Vietnamese",
  "Filipino",
  "Thai",
  "Other Southeast Asian",
  "Indian",
  "Pakistani / Bangladeshi",
  "Other South Asian",
  "Native American / Alaska Native",
  "Native Hawaiian / Pacific Islander",
  "Other",
] as const;
const OCCUPATIONS = [
  "Healthcare / medical",
  "Nursing",
  "Education / teaching",
  "Business / management",
  "Finance / accounting",
  "Engineering",
  "IT / software",
  "Science / research",
  "Law",
  "Government / public service",
  "Military",
  "Police / fire / security",
  "Arts / design / media",
  "Sales / retail",
  "Hospitality / food service",
  "Construction / skilled trades",
  "Manufacturing",
  "Transportation / logistics",
  "Agriculture / farming",
  "Beauty / wellness / fitness",
  "Social work / counseling",
  "Religious / ministry",
  "Business owner / self-employed",
  "Homemaker",
  "Student",
  "Retired",
  "Not working",
  "Other",
  "Unknown",
] as const;
const MAJORS = [
  "None (did not attend college)",
  "Undecided",
  "Biology / life sciences",
  "Chemistry / biochemistry",
  "Physics / astronomy",
  "Mathematics / statistics",
  "Computer science",
  "Engineering",
  "Nursing",
  "Medicine / pre-med",
  "Pharmacy",
  "Public health",
  "Kinesiology / exercise science",
  "Nutrition / dietetics",
  "Psychology",
  "Sociology / social work",
  "Political science / international relations",
  "Economics",
  "Business / management",
  "Finance / accounting",
  "Marketing",
  "Communications / journalism",
  "Education",
  "English / literature / writing",
  "History",
  "Philosophy / religious studies",
  "Foreign languages",
  "Art / graphic design",
  "Music",
  "Theater / film",
  "Architecture",
  "Law / pre-law",
  "Criminal justice",
  "Environmental science",
  "Agriculture",
  "Hospitality / tourism",
  "Other",
] as const;
const SUBJECTS = [
  "Math",
  "Biology",
  "Chemistry",
  "Physics",
  "English / writing",
  "History / social studies",
  "Foreign languages",
  "Computer science",
  "Business / economics",
  "Art",
  "Music",
  "Sports / PE",
  "Other",
] as const;

/** Physical traits, ethnicity, education and work of each close relative. */
const RELATIVE_COLUMNS: readonly GridColumn[] = [
  {
    key: "living",
    label: "Living or deceased",
    kind: "select",
    options: ["Living", "Deceased", "Unknown"],
  },
  { key: "age", label: "Age (or age at death)", kind: "select", options: AGES },
  { key: "height", label: "Height", kind: "select", options: HEIGHTS },
  { key: "eyeColor", label: "Eye color", kind: "select", options: [...EYE_COLORS, "Unknown"] },
  {
    key: "hairColor",
    label: "Natural hair color",
    kind: "select",
    options: [...HAIR_COLORS, "Unknown"],
  },
  {
    key: "ethnicity",
    label: "Ethnicity",
    kind: "select",
    options: [...ETHNICITIES, "Mixed", "Unknown"],
  },
  { key: "education", label: "Education", kind: "select", options: EDUCATION_LEVELS },
  { key: "occupation", label: "Occupation", kind: "select", options: OCCUPATIONS },
];
const SIBLING_COLUMNS: readonly GridColumn[] = [
  {
    key: "relation",
    label: "Relation",
    kind: "select",
    options: ["Brother", "Sister", "Half-brother", "Half-sister"],
  },
  ...RELATIVE_COLUMNS,
];

const FAMILY_CHECKLIST_NONE = NONE;
const famChecklist = (name: string, label: string, options: string[]): FieldDef => ({
  name,
  label,
  kind: "multi",
  required: true,
  options: [...options, FAMILY_CHECKLIST_NONE],
});
const FAMILY_CHECKLIST: FieldDef[] = [
  famChecklist("famCancer", "Cancer", [
    "Breast",
    "Colon or intestinal",
    "Lung",
    "Ovarian or uterine",
    "Prostate or testicular",
    "Skin (melanoma)",
    "Stomach",
    "Thyroid",
    "Blood (e.g. leukemia, lymphoma)",
    "Other cancer",
  ]),
  famChecklist("famHeart", "Heart and circulation", [
    "Stroke",
    "Heart attack",
    "Congenital heart disease / heart defect",
    "Hardening of the arteries",
    "High blood pressure",
    "High cholesterol",
    "Other heart condition",
  ]),
  famChecklist("famBlood", "Blood and immune system", [
    "Anemia",
    "Sickle cell anemia or trait",
    "Thalassemia",
    "Factor V Leiden / blood clots",
    "Hemophilia, von Willebrand or other bleeding disorder",
    "Immune deficiency",
    "HIV",
    "Other blood disorder",
  ]),
  famChecklist("famRespiratory", "Lungs and breathing", [
    "Asthma",
    "Hay fever / severe allergies",
    "Emphysema / COPD",
    "Cystic fibrosis",
    "Alpha-1 antitrypsin deficiency",
    "Other lung disease",
  ]),
  famChecklist("famDigestive", "Digestive system and liver", [
    "Stomach or duodenal ulcer",
    "Gallstones",
    "Hepatitis A, B or C",
    "Cirrhosis or other liver disease",
    "Crohn's disease / ulcerative colitis",
    "Celiac disease",
    "Multiple colon polyps",
    "Pyloric stenosis",
    "Other digestive problem",
  ]),
  famChecklist("famMetabolic", "Hormones and metabolism", [
    "Type 1 / childhood diabetes",
    "Type 2 diabetes",
    "Thyroid disorder / goiter",
    "Hypoglycemia",
    "Adrenal disorder",
    "PKU or other inherited metabolic disorder",
    "Severe obesity",
    "Dwarfism / growth disorder",
    "Other hormone or metabolic disorder",
  ]),
  famChecklist("famNeuro", "Brain and nervous system", [
    "Migraines",
    "Epilepsy / seizures",
    "ADD / ADHD",
    "Autism spectrum disorder",
    "Intellectual disability",
    "Alzheimer's or dementia before age 60",
    "Parkinson's disease",
    "Multiple sclerosis",
    "Cerebral palsy",
    "Huntington's disease",
    "Tourette syndrome",
    "Neurofibromatosis / tuberous sclerosis",
    "Hydrocephalus",
    "Scoliosis",
    "Other nervous system disorder",
  ]),
  famChecklist("famMental", "Mental health", [
    "Anxiety / panic attacks",
    "Depression",
    "Bipolar disorder",
    "Schizophrenia",
    "Eating disorder",
    "Obsessive-compulsive disorder",
    "Suicide or suicide attempt",
    "Other condition that needed treatment",
  ]),
  famChecklist("famMuscleBone", "Muscles, bones and joints", [
    "Muscular dystrophy",
    "Spinal muscular atrophy",
    "Achondroplasia",
    "Brittle bone disease (osteogenesis imperfecta)",
    "Marfan syndrome",
    "Rheumatoid or juvenile arthritis",
    "Lupus",
    "Osteoporosis before age 50",
    "Gout",
    "Myasthenia gravis",
    "Other muscle, bone or joint disorder",
  ]),
  famChecklist("famSenses", "Eyes, ears and senses", [
    "Deafness / hearing loss before age 60",
    "Blindness",
    "Cataracts before age 50",
    "Glaucoma",
    "Color blindness",
    "Severe nearsightedness",
    "Retinitis pigmentosa",
    "Retinoblastoma",
    "Other eye, ear or sensory disorder",
  ]),
  famChecklist("famSkin", "Skin", [
    "Severe acne",
    "Eczema",
    "Psoriasis",
    "Albinism",
    "Pigmentation disorder (e.g. vitiligo)",
    "More than 5 coffee-colored spots",
    "Other skin disorder",
  ]),
  famChecklist("famBirthDefects", "Birth defects", [
    "Cleft lip or palate",
    "Club foot",
    "Congenital hip problem",
    "Heart defect at birth",
    "Spina bifida / neural tube defect",
    "Microcephaly",
    "Hearing problem from birth",
    "Other birth defect",
  ]),
  famChecklist("famOther", "Other", [
    "Down syndrome",
    "Fragile X, Turner or Klinefelter syndrome",
    "Tay-Sachs or other inherited disorder",
    "Alcoholism",
    "Drug addiction",
    "Early failure of any organ",
    "Any other condition not listed here",
  ]),
];

export const FORM_SECTIONS: FormSectionDef[] = [
  {
    id: "background",
    title: SECTION_TITLES.background,
    description: "Help intended parents get to know you.",
    fields: [
      {
        name: "occupation",
        label: "Occupation or field of study",
        kind: "text",
        required: true,
        max: 120,
      },
      {
        name: "hobbies",
        label: "Hobbies and interests",
        kind: "textarea",
        required: true,
        max: 1500,
      },
      {
        name: "personality",
        label: "Describe your personality",
        kind: "textarea",
        required: true,
        max: 1500,
      },
      {
        name: "whyDonate",
        label: "Why would you like to become a donor?",
        kind: "textarea",
        required: true,
        max: 1500,
      },
      {
        name: "placeOfBirth",
        label: "Place of birth (city, state / country)",
        kind: "text",
        required: true,
        max: 120,
        identifying: true,
      },
      {
        name: "maritalStatus",
        label: "Marital status",
        kind: "select",
        required: true,
        options: ["Single", "In a relationship", "Married", "Divorced", "Separated", "Widowed"],
      },
      {
        name: "race",
        label: "Race (choose all that apply)",
        kind: "multi",
        required: true,
        options: RACES,
      },
      {
        name: "maternalAncestry",
        label: "Ethnic ancestry on your mother's side (choose all that apply)",
        hint: "Your family's roots — not your nationality or where you were born.",
        kind: "multi",
        required: true,
        options: [...ETHNICITIES, "Don't know"],
      },
      {
        name: "paternalAncestry",
        label: "Ethnic ancestry on your father's side (choose all that apply)",
        kind: "multi",
        required: true,
        options: [...ETHNICITIES, "Don't know"],
      },
      {
        name: "religion",
        label: "Religion or spirituality",
        kind: "select",
        required: true,
        options: [
          "None",
          "Christian",
          "Catholic",
          "Jewish",
          "Muslim",
          "Hindu",
          "Buddhist",
          "Spiritual, not religious",
          "Other",
          "Prefer not to say",
        ],
      },
      {
        name: "religionRole",
        label: "How does religion or spirituality play a role in your family? (optional)",
        kind: "textarea",
        max: 1000,
      },
      {
        name: "upbringing",
        label: "What kind of household did you grow up in?",
        hint: "For example: who raised you, brothers and sisters, where you grew up, family values.",
        kind: "textarea",
        required: true,
        max: 1500,
      },
      {
        name: "talents",
        label: "Special skills, talents or abilities",
        hint: "Music, sports, languages, art, cooking, coding — anything you're good at.",
        kind: "textarea",
        required: true,
        max: 1500,
      },
      {
        name: "messageToParents",
        label:
          "What kind of family would you like to help, and what would you like to say to the intended parents?",
        kind: "textarea",
        required: true,
        max: 2000,
      },
      {
        name: "relationshipPreference",
        label: "What kind of relationship with the family would you prefer?",
        hint: "Anonymous: no identifying information shared. Semi-open: limited contact through us. Open: willing to share identity or meet.",
        kind: "select",
        required: true,
        options: ["Anonymous", "Semi-open", "Open", "Not sure yet"],
      },
    ],
  },
  {
    id: "education",
    title: SECTION_TITLES.education,
    description: "Intended parents often ask about education and work.",
    fields: [
      {
        name: "school",
        label: "College or university you attend or attended (or “None”)",
        hint: "Start typing and pick your school from the list. Not listed? Just type its full name.",
        kind: "text",
        widget: "school",
        required: true,
        max: 200,
        identifying: true,
      },
      {
        name: "school2",
        label: "Another college or university (optional)",
        kind: "text",
        max: 200,
        widget: "school",
        identifying: true,
        showIf: { field: "school", filled: true },
      },
      {
        name: "school3",
        label: "Another college or university (optional)",
        kind: "text",
        max: 200,
        widget: "school",
        identifying: true,
        showIf: { field: "school2", filled: true },
      },
      {
        name: "major",
        label: "Major or field of study",
        kind: "select",
        required: true,
        options: MAJORS,
      },
      {
        name: "academicStrengths",
        label: "Your strongest subjects (choose all that apply)",
        kind: "multi",
        required: true,
        options: SUBJECTS,
      },
      {
        name: "gpa",
        label: "GPA (optional)",
        kind: "select",
        options: [
          "3.8 – 4.0",
          "3.5 – 3.7",
          "3.0 – 3.4",
          "2.5 – 2.9",
          "Below 2.5",
          "Don't know / not applicable",
        ],
      },
      {
        name: "testScores",
        label: "SAT or ACT score (optional)",
        hint: "For example: SAT 1350 or ACT 29.",
        kind: "text",
        max: 200,
      },
      {
        name: "achievements",
        label: "Awards, honors, Dean's List, volunteer work or other accomplishments (optional)",
        kind: "textarea",
        max: 1500,
      },
      {
        name: "employmentStatus",
        label: "Current employment status",
        kind: "select",
        required: true,
        options: [
          "Employed full-time",
          "Employed part-time",
          "Self-employed",
          "Student",
          "Student and working",
          "Military",
          "Homemaker",
          "Not currently working",
        ],
      },
      {
        name: "careerGoals",
        label: "Your future goals and career plans",
        kind: "textarea",
        required: true,
        max: 1500,
      },
    ],
  },
  {
    id: "appearance",
    title: SECTION_TITLES.appearance,
    description: "Used only for anonymous profile matching.",
    fields: [
      {
        name: "eyeColor",
        label: "Eye color",
        kind: "select",
        required: true,
        options: EYE_COLORS,
      },
      {
        name: "hairColor",
        label: "Natural hair color",
        kind: "select",
        required: true,
        options: HAIR_COLORS,
      },
      {
        name: "hairTexture",
        label: "Hair texture",
        kind: "select",
        required: true,
        options: ["Straight", "Wavy", "Curly", "Coily"],
      },
      {
        name: "skinTone",
        label: "Skin tone",
        kind: "select",
        required: true,
        options: ["Very fair", "Fair", "Medium", "Olive", "Brown", "Dark"],
      },
      {
        name: "build",
        label: "Body build",
        kind: "select",
        required: true,
        options: ["Slim", "Athletic", "Average", "Curvy / stocky"],
      },
      {
        name: "bloodType",
        label: "Blood type",
        kind: "select",
        required: true,
        options: ["A+", "A−", "B+", "B−", "AB+", "AB−", "O+", "O−", "Don't know"],
      },
      {
        name: "handedness",
        label: "Which hand do you write with?",
        kind: "select",
        required: true,
        options: ["Right", "Left", "Both (ambidextrous)"],
      },
      {
        name: "glasses",
        label: "Do you wear glasses or contacts, or have you had laser eye surgery?",
        kind: "yesno",
        required: true,
      },
      {
        name: "visionDetails",
        label: "Which one, and what for (e.g. nearsighted, farsighted, astigmatism)?",
        kind: "text",
        required: true,
        max: 300,
        showIf: { field: "glasses", equals: "Yes" },
      },
      {
        name: "dimplesFreckles",
        label: "Other features (optional)",
        hint: "Dimples, freckles, birthmarks, a distinctive smile — anything parents might like to know.",
        kind: "text",
        max: 300,
      },
    ],
  },
  {
    id: "medical",
    title: SECTION_TITLES.medical,
    description: "Confidential. Shared only with partner medical providers.",
    fields: [
      {
        name: "conditions",
        label:
          "Have you ever been diagnosed with, or treated for, any of the following — or any other physical, mental-health or genetic condition?",
        hint: "This list shows common examples only and is not complete. Please tell us about every condition you know of, even if it isn't listed — choose “Other condition not listed here” and describe it.",
        kind: "multi",
        required: true,
        options: PERSONAL_CONDITIONS,
      },
      {
        name: "conditionDetails",
        label:
          "Please describe each condition (including any not listed above): when it was diagnosed, treatment, and current status",
        kind: "textarea",
        required: true,
        max: 2000,
        showIf: { field: "conditions", anyExcept: NONE },
      },
      {
        name: "takingMedications",
        label:
          "Are you currently taking any medications (prescription or regular over-the-counter)?",
        kind: "yesno",
        required: true,
      },
      {
        name: "medications",
        label: "Which medications, the dose, and what they are for",
        kind: "textarea",
        required: true,
        max: 1000,
        showIf: { field: "takingMedications", equals: "Yes" },
      },
      {
        name: "hadSurgeries",
        label: "Have you ever had surgery or been hospitalized?",
        kind: "yesno",
        required: true,
      },
      {
        name: "surgeries",
        label: "What was it for, and roughly when?",
        kind: "textarea",
        required: true,
        max: 1000,
        showIf: { field: "hadSurgeries", equals: "Yes" },
      },
      { name: "hasAllergies", label: "Do you have any allergies?", kind: "yesno", required: true },
      {
        name: "allergies",
        label: "Which allergies, and how do they affect you?",
        kind: "text",
        required: true,
        max: 300,
        showIf: { field: "hasAllergies", equals: "Yes" },
      },
      {
        name: "mentalHealthTreatment",
        label: "Have you ever received treatment for a mental health condition?",
        kind: "yesno",
        required: true,
      },
      {
        name: "mentalHealthDetails",
        label: "What was the condition, when, and what treatment did you receive?",
        kind: "textarea",
        required: true,
        max: 1500,
        showIf: { field: "mentalHealthTreatment", equals: "Yes" },
      },
      {
        name: "alcohol",
        label: "Alcohol use",
        kind: "select",
        required: true,
        options: ["None", "Occasional", "Weekly", "Daily"],
      },
      {
        name: "recreationalDrugs",
        label: "Have you used recreational drugs in the past 12 months?",
        kind: "yesno",
        required: true,
      },
      {
        name: "drugDetails",
        label: "Which substances, and how often?",
        kind: "textarea",
        required: true,
        max: 1000,
        showIf: { field: "recreationalDrugs", equals: "Yes" },
      },
      {
        name: "recentTattoo",
        label: "Have you had a tattoo or piercing in the past 12 months?",
        kind: "yesno",
        required: true,
      },
      {
        name: "tattooDetails",
        label: "When, and was it done at a licensed studio?",
        kind: "text",
        required: true,
        max: 300,
        showIf: { field: "recentTattoo", equals: "Yes" },
      },
      {
        name: "teeth",
        label: "Condition of your teeth",
        kind: "select",
        required: true,
        options: ["Excellent", "Good", "Fair (some fillings or minor problems)", "Poor"],
      },
      {
        name: "hearing",
        label: "Your hearing",
        kind: "select",
        required: true,
        options: ["Normal", "Mild hearing loss", "Significant loss / hearing aid"],
      },
      {
        name: "everSmoked",
        label: "Have you ever smoked cigarettes or vaped, even in the past?",
        kind: "yesno",
        required: true,
      },
      {
        name: "smokingDetails",
        label: "What, how much, and when did you stop (if you have)?",
        kind: "text",
        required: true,
        max: 300,
        showIf: { field: "everSmoked", equals: "Yes" },
      },
      {
        name: "injectedDrugs",
        label:
          "Have you ever injected drugs that were not prescribed to you, or had a sexual partner who did?",
        kind: "yesno",
        required: true,
      },
      {
        name: "injectedDrugsDetails",
        label: "Please tell us more (what and when)",
        kind: "textarea",
        required: true,
        max: 1000,
        showIf: { field: "injectedDrugs", equals: "Yes" },
      },
      {
        name: "acupuncture",
        label:
          "Have you had acupuncture or any other skin-piercing treatment in the past 12 months?",
        kind: "yesno",
        required: true,
      },
      {
        name: "acupunctureDetails",
        label: "When, and was it done by a licensed practitioner?",
        kind: "text",
        required: true,
        max: 300,
        showIf: { field: "acupuncture", equals: "Yes" },
      },
      {
        name: "zika",
        label:
          "In the past 12 months, have you had Zika virus, tested positive for it, or traveled to an area with active Zika?",
        kind: "yesno",
        required: true,
      },
      {
        name: "zikaDetails",
        label: "Where and when?",
        kind: "text",
        required: true,
        max: 300,
        showIf: { field: "zika", equals: "Yes" },
      },
      {
        name: "doctorCare",
        label: "Are you currently under a doctor's care for any reason?",
        kind: "yesno",
        required: true,
      },
      {
        name: "doctorCareDetails",
        label: "What for?",
        kind: "textarea",
        required: true,
        max: 1000,
        showIf: { field: "doctorCare", equals: "Yes" },
      },
      {
        name: "anesthesia",
        label: "Have you ever had complications or problems with anesthesia?",
        kind: "yesno",
        required: true,
      },
      {
        name: "anesthesiaDetails",
        label: "What happened?",
        kind: "textarea",
        required: true,
        max: 1000,
        showIf: { field: "anesthesia", equals: "Yes" },
      },
      {
        name: "psychMeds",
        label:
          "Have you ever taken medication such as anti-anxiety medicine or antidepressants for an emotional or psychological problem?",
        kind: "yesno",
        required: true,
      },
      {
        name: "psychMedsDetails",
        label: "Which medication, when, and for how long?",
        kind: "textarea",
        required: true,
        max: 1000,
        showIf: { field: "psychMeds", equals: "Yes" },
      },
      {
        name: "medsPastYear",
        label:
          "Apart from anything listed above, have you taken any medications in the past 12 months?",
        kind: "yesno",
        required: true,
      },
      {
        name: "medsPastYearDetails",
        label: "Which ones, and what for?",
        kind: "textarea",
        required: true,
        max: 1000,
        showIf: { field: "medsPastYear", equals: "Yes" },
      },
      {
        name: "transfusion",
        label: "Have you ever had a blood transfusion?",
        kind: "yesno",
        required: true,
      },
      {
        name: "transfusionDetails",
        label: "When, and why?",
        kind: "text",
        required: true,
        max: 300,
        showIf: { field: "transfusion", equals: "Yes" },
      },
      {
        name: "recentVaccines",
        label: "Have you had any vaccinations in the past 12 months?",
        kind: "yesno",
        required: true,
      },
      {
        name: "recentVaccinesDetails",
        label: "Which vaccines, and when?",
        kind: "text",
        required: true,
        max: 300,
        showIf: { field: "recentVaccines", equals: "Yes" },
      },
      {
        name: "radiation",
        label:
          "Have you had significant radiation or X-ray exposure (e.g. radiation therapy, or X-rays as part of your job)?",
        kind: "yesno",
        required: true,
      },
      {
        name: "radiationDetails",
        label: "Please describe",
        kind: "textarea",
        required: true,
        max: 1000,
        showIf: { field: "radiation", equals: "Yes" },
      },
    ],
  },
  {
    id: "family",
    title: SECTION_TITLES.family,
    description: "Three generations: parents, siblings and grandparents. Share what you know.",
    fields: [
      { name: "adopted", label: "Were you adopted?", kind: "yesno", required: true },
      {
        name: "adoptionDetails",
        label: "How much do you know about your biological family's health history?",
        kind: "textarea",
        required: true,
        max: 1000,
        showIf: { field: "adopted", equals: "Yes" },
      },
      {
        name: "relatives",
        label: "Your parents and grandparents",
        hint: "Intended parents care a lot about these. Pick from each list — choose “Unknown” if you don't know something.",
        kind: "grid",
        required: true,
        rows: [
          { key: "mother", label: "Mother", required: true },
          { key: "father", label: "Father", required: true },
          {
            key: "maternalGrandmother",
            label: "Maternal grandmother (mother's mother)",
            required: true,
          },
          {
            key: "maternalGrandfather",
            label: "Maternal grandfather (mother's father)",
            required: true,
          },
          {
            key: "paternalGrandmother",
            label: "Paternal grandmother (father's mother)",
            required: true,
          },
          {
            key: "paternalGrandfather",
            label: "Paternal grandfather (father's father)",
            required: true,
          },
        ],
        columns: RELATIVE_COLUMNS,
      },
      {
        name: "siblingCount",
        label: "How many brothers and sisters do you have (including half-siblings)?",
        kind: "number",
        required: true,
        min: 0,
        max: 20,
      },
      {
        name: "siblingDetails",
        label: "Your brothers and sisters",
        hint: "Fill in one row per brother or sister (up to 4).",
        kind: "grid",
        required: true,
        rows: [
          { key: "sibling1", label: "Brother / sister 1" },
          { key: "sibling2", label: "Brother / sister 2" },
          { key: "sibling3", label: "Brother / sister 3" },
          { key: "sibling4", label: "Brother / sister 4" },
        ],
        columns: SIBLING_COLUMNS,
        showIf: { field: "siblingCount", gt: 0 },
      },
      ...FAMILY_CHECKLIST.map((f, i) =>
        i === 0
          ? {
              ...f,
              hint: "Has any blood relative (parents, brothers and sisters, grandparents, aunts, uncles, cousins) had any of the following? Think about their surgeries, hospital stays and medications. These lists are examples only — if something isn't listed, choose the “Other” option and describe it below.",
            }
          : f,
      ),
      {
        name: "familyChecklistDetails",
        label:
          "For each condition you ticked: what it is, which relative, and their age when it was diagnosed",
        kind: "textarea",
        required: true,
        max: 3000,
        showIf: { fields: FAMILY_CHECKLIST.map((f) => f.name), anyExcept: NONE },
      },
      {
        name: "familyConditions",
        retired: true,
        label:
          "Has any blood relative had any of the following — or any other physical, mental-health, genetic or inherited condition?",
        hint: "This list shows common examples only and is not complete. If a relative has any condition that isn't listed, choose “Other condition not listed here” and describe it.",
        kind: "multi",
        required: true,
        options: FAMILY_CONDITIONS,
      },
      {
        name: "familyConditionDetails",
        retired: true,
        label:
          "For each condition (including any not listed above): what it is, which relative, and their age when diagnosed",
        kind: "textarea",
        required: true,
        max: 2000,
        showIf: { field: "familyConditions", anyExcept: NONE },
      },
      {
        name: "mother",
        label: "Mother — health conditions, or age and cause of death",
        kind: "textarea",
        required: true,
        max: 1000,
      },
      {
        name: "father",
        label: "Father — health conditions, or age and cause of death",
        kind: "textarea",
        required: true,
        max: 1000,
      },
      {
        name: "siblings",
        label: "Siblings — health conditions (or 'None')",
        kind: "textarea",
        required: true,
        max: 1000,
      },
      {
        name: "maternalGrandparents",
        label: "Maternal grandparents — health conditions / cause of death",
        kind: "textarea",
        required: true,
        max: 1000,
      },
      {
        name: "paternalGrandparents",
        label: "Paternal grandparents — health conditions / cause of death",
        kind: "textarea",
        required: true,
        max: 1000,
      },
      {
        name: "prematureBaldness",
        label: "Do you or anyone in your family have premature baldness?",
        kind: "yesno",
        required: true,
      },
      {
        name: "prematureGraying",
        label: "Do you or anyone in your family have premature graying (gray hair before 30)?",
        kind: "yesno",
        required: true,
      },
      {
        name: "anythingElse",
        label:
          "Is there anything else about your own or your blood relatives' health — including any genetic or inherited condition, or a condition not asked about above — that you know of?",
        kind: "yesno",
        required: true,
      },
      {
        name: "anythingElseDetails",
        label: "Please tell us about it",
        kind: "textarea",
        required: true,
        max: 2000,
        showIf: { field: "anythingElse", equals: "Yes" },
      },
    ],
  },
  {
    id: "reproductive",
    title: SECTION_TITLES.reproductive,
    description: "Confidential. Shared only with partner medical providers.",
    fields: [
      {
        name: "ageFirstPeriod",
        label: "Age at first period",
        kind: "number",
        required: true,
        min: 8,
        max: 20,
        onlyFor: "egg",
      },
      {
        name: "cycleLength",
        label: "Typical cycle length (days)",
        kind: "number",
        required: true,
        min: 15,
        max: 60,
        onlyFor: "egg",
      },
      {
        name: "pregnancies",
        label: "Number of pregnancies",
        kind: "number",
        required: true,
        min: 0,
        max: 20,
        onlyFor: "egg",
      },
      {
        name: "pregnancyDetails",
        label: "For each pregnancy: the year and the outcome",
        kind: "textarea",
        required: true,
        max: 1500,
        onlyFor: "egg",
        showIf: { field: "pregnancies", gt: 0 },
      },
      {
        name: "liveBirths",
        label: "Number of live births",
        kind: "number",
        required: true,
        min: 0,
        max: 20,
        onlyFor: "egg",
      },
      {
        name: "childrenFathered",
        label: "Number of biological children",
        kind: "number",
        required: true,
        min: 0,
        max: 50,
        onlyFor: "sperm",
      },
      {
        name: "childrenDetails",
        label: "Year of birth of each child, and any health conditions",
        kind: "textarea",
        required: true,
        max: 1500,
        onlyFor: "sperm",
        showIf: { field: "childrenFathered", gt: 0 },
      },
      {
        name: "vasectomy",
        label: "Have you had a vasectomy?",
        kind: "yesno",
        required: true,
        onlyFor: "sperm",
      },
      {
        name: "vasectomyDetails",
        label: "When was it done, and has it been reversed?",
        kind: "text",
        required: true,
        max: 300,
        onlyFor: "sperm",
        showIf: { field: "vasectomy", equals: "Yes" },
      },
      {
        name: "stdHistory",
        label: "Have you ever been diagnosed with an STI?",
        kind: "yesno",
        required: true,
      },
      {
        name: "stdDetails",
        label: "Which infection, when, and was it treated?",
        kind: "textarea",
        required: true,
        max: 1000,
        showIf: { field: "stdHistory", equals: "Yes" },
      },
      {
        name: "hasReproductiveConditions",
        label: "Have you had any reproductive conditions or concerns?",
        kind: "yesno",
        required: true,
        hint: "For example: PCOS, endometriosis, varicocele, undescended testicle.",
      },
      {
        name: "reproductiveConditions",
        label: "Please describe the condition and any treatment",
        kind: "textarea",
        required: true,
        max: 1500,
        showIf: { field: "hasReproductiveConditions", equals: "Yes" },
      },
      {
        name: "childrenHealthy",
        label: "Were all of your children born healthy, without birth defects?",
        hint: "For example: heart defect, cleft lip, club foot.",
        kind: "yesno",
        required: true,
        onlyFor: "egg",
        showIf: { field: "liveBirths", gt: 0 },
      },
      {
        name: "childrenHealthy",
        label: "Were all of your children born healthy, without birth defects?",
        hint: "For example: heart defect, cleft lip, club foot.",
        kind: "yesno",
        required: true,
        onlyFor: "sperm",
        showIf: { field: "childrenFathered", gt: 0 },
      },
      {
        name: "childrenHealthDetails",
        label: "Please describe the condition",
        kind: "textarea",
        required: true,
        max: 1000,
        showIf: { field: "childrenHealthy", equals: "No" },
      },
      {
        name: "breastfeeding",
        label: "Are you currently breastfeeding?",
        kind: "yesno",
        required: true,
        onlyFor: "egg",
      },
      {
        name: "lastPap",
        label: "When was your last Pap smear?",
        kind: "select",
        required: true,
        onlyFor: "egg",
        options: [
          "In the last 12 months",
          "1–2 years ago",
          "2–3 years ago",
          "More than 3 years ago",
          "Never",
          "Don't remember",
        ],
      },
      {
        name: "abnormalPap",
        label: "Have you ever had an abnormal Pap smear?",
        kind: "yesno",
        required: true,
        onlyFor: "egg",
      },
      {
        name: "abnormalPapDetails",
        label: "When, and what follow-up or treatment did you have?",
        kind: "textarea",
        required: true,
        max: 1000,
        onlyFor: "egg",
        showIf: { field: "abnormalPap", equals: "Yes" },
      },
      {
        name: "sexualOrientation",
        label: "Sexual orientation",
        hint: "Asked because FDA donor screening rules require it. Kept confidential.",
        kind: "select",
        required: true,
        options: ["Heterosexual", "Gay / lesbian", "Bisexual", "Other", "Prefer not to say"],
      },
      {
        name: "partnersPast6Months",
        label: "Number of sexual partners in the past 6 months",
        kind: "number",
        required: true,
        min: 0,
        max: 100,
      },
      {
        name: "unprotectedNewPartner",
        label: "In the past 6 months, have you had sex without a condom with a new partner?",
        kind: "yesno",
        required: true,
      },
      {
        name: "geneticTesting",
        label: "Have you ever had genetic testing (e.g. carrier screening, 23andMe health report)?",
        kind: "yesno",
        required: true,
      },
      {
        name: "geneticTestingDetails",
        label: "Which test, when, and did it find any genetic condition or carrier status?",
        kind: "textarea",
        required: true,
        max: 1500,
        showIf: { field: "geneticTesting", equals: "Yes" },
      },
      {
        name: "previousDonationDetails",
        label:
          "If you have donated before: for each donation, the clinic and city, the result, and whether it led to a pregnancy or birth (optional)",
        hint: "Leave empty if this is your first donation.",
        kind: "textarea",
        max: 2000,
      },
    ],
  },
];

/** The questions an applicant of this donor type answers in a section. */
export function sectionFields(id: FormSectionId, donorType: DonorType): FieldDef[] {
  const def = FORM_SECTIONS.find((s) => s.id === id)!;
  return def.fields.filter((f) => !f.retired && (!f.onlyFor || f.onlyFor === donorType));
}

/**
 * Questions to show staff for a saved section: the current ones, plus retired
 * ones that this applicant answered before they were replaced.
 */
export function displayFields(
  id: FormSectionId,
  donorType: DonorType,
  values: Record<string, unknown>,
): FieldDef[] {
  const def = FORM_SECTIONS.find((s) => s.id === id)!;
  return def.fields.filter(
    (f) =>
      (!f.onlyFor || f.onlyFor === donorType) &&
      (!f.retired || !isBlank(values[f.name])) &&
      isFieldVisible(f, values),
  );
}

/**
 * Saved answers made ready for the form: an answer that is no longer one of a
 * question's choices (e.g. typed text from before it became a dropdown) is
 * cleared so the applicant picks again, instead of the save being rejected.
 */
export function sanitizeForForm(
  fields: FieldDef[],
  values: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...values };
  for (const f of fields) {
    const v = out[f.name];
    if (v === undefined) continue;
    if (f.kind === "select" && !(f.options ?? []).includes(v as string)) delete out[f.name];
    else if (f.kind === "multi") {
      const kept = Array.isArray(v) ? v.filter((x) => (f.options ?? []).includes(x)) : [];
      if (kept.length) out[f.name] = kept;
      else delete out[f.name];
    } else if (f.kind === "grid") {
      const grid = (v && typeof v === "object" ? v : {}) as Record<string, Record<string, unknown>>;
      const next: Record<string, Record<string, unknown>> = {};
      for (const r of f.rows ?? []) {
        const row: Record<string, unknown> = {};
        for (const c of f.columns ?? []) {
          const x = grid[r.key]?.[c.key];
          if (typeof x !== "string" || !x) continue;
          if (c.kind === "select" && !(c.options ?? []).includes(x)) continue;
          row[c.key] = x;
        }
        if (Object.keys(row).length) next[r.key] = row;
      }
      out[f.name] = next;
    }
  }
  return out;
}

/** A saved answer as readable text (grids become one line per person). */
export function formatAnswer(f: FieldDef, v: unknown): string {
  if (f.kind === "grid") {
    const grid = (v && typeof v === "object" ? v : {}) as Record<string, Record<string, unknown>>;
    const lines = (f.rows ?? []).flatMap((r) => {
      const cells = (f.columns ?? [])
        .map((c) => [c.label, grid[r.key]?.[c.key]] as const)
        .filter(([, x]) => typeof x === "string" && x.trim() !== "")
        .map(([l, x]) => `${l}: ${String(x).trim()}`);
      return cells.length ? [`${r.label} — ${cells.join(" · ")}`] : [];
    });
    return lines.length ? lines.join("\n") : "–";
  }
  if (v === null || v === undefined || v === "") return "–";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (Array.isArray(v)) return v.length ? v.join(", ") : "–";
  return String(v);
}

/** Is this (follow-up) field shown, given the answers so far? */
export function isFieldVisible(f: FieldDef, values: Record<string, unknown>): boolean {
  const c = f.showIf;
  if (!c) return true;
  if ("filled" in c) return !isBlank(values[c.field]);
  if ("fields" in c) {
    return c.fields.some((name) => {
      const x = values[name];
      const arr = Array.isArray(x) ? x : x ? [x] : [];
      return arr.some((y) => y !== c.anyExcept);
    });
  }
  const v = values[c.field];
  if ("equals" in c) return v === c.equals;
  if ("anyExcept" in c) {
    const arr = Array.isArray(v) ? v : v ? [v] : [];
    return arr.some((x) => x !== c.anyExcept);
  }
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) && n > c.gt;
}

/** Remove answers to follow-up questions that are no longer shown. */
export function dropHidden(
  fields: FieldDef[],
  values: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(values)) {
    const f = fields.find((x) => x.name === k);
    if (f && !isFieldVisible(f, values)) continue;
    out[k] = v;
  }
  return out;
}

function isBlank(v: unknown): boolean {
  if (v === undefined || v === null) return true;
  if (typeof v === "string") return v.trim() === "";
  if (Array.isArray(v)) return v.length === 0;
  // A grid is blank when no cell has been filled in.
  if (typeof v === "object") return Object.values(v as object).every(isBlank);
  return false;
}

/** Required follow-ups that are shown but unanswered: { field: message }. */
export function followUpIssues(
  fields: FieldDef[],
  values: Record<string, unknown>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of fields) {
    if (f.showIf && f.required && isFieldVisible(f, values) && isBlank(values[f.name])) {
      out[f.name] = "Please answer this follow-up question";
    }
  }
  return out;
}

function fieldSchema(f: FieldDef, strict: boolean): z.ZodType {
  // Follow-ups are validated for "required" in sectionSchema (they depend on other answers).
  if (f.showIf) strict = false;
  const requiredMsg = "This field is required";
  switch (f.kind) {
    case "text":
    case "textarea": {
      const base = z
        .string()
        .trim()
        .max(f.max ?? 2000, `Please keep this under ${f.max ?? 2000} characters`);
      return strict && f.required ? base.min(1, requiredMsg) : base.optional();
    }
    case "select": {
      const e = z.enum(f.options as [string, ...string[]], { error: "Please choose an option" });
      return strict && f.required ? e : e.optional().or(z.literal(""));
    }
    case "yesno": {
      const e = z.enum(YES_NO_NA, { error: "Please choose Yes or No" });
      return strict && f.required ? e : e.optional();
    }
    case "multi": {
      const arr = z.array(z.enum(f.options as [string, ...string[]])).max(f.options!.length);
      const msg = f.options!.includes(NONE)
        ? "Please select at least one option (or 'None of these')"
        : "Please select at least one option";
      return strict && f.required ? arr.min(1, msg) : arr.optional();
    }
    case "grid": {
      const rowShape: Record<string, z.ZodType> = {};
      for (const r of f.rows ?? []) {
        const cells: Record<string, z.ZodType> = {};
        for (const c of f.columns ?? []) {
          const needed = strict && f.required && r.required;
          if (c.kind === "select") {
            const e = z.enum(c.options as [string, ...string[]], { error: "Please choose one" });
            cells[c.key] = needed ? e : e.optional().or(z.literal(""));
          } else {
            const t = z
              .string()
              .trim()
              .max(c.max ?? 200, `Please keep this under ${c.max ?? 200} characters`);
            cells[c.key] = needed
              ? t.min(1, "Required (write “Unknown” if you don't know)")
              : t.optional();
          }
        }
        const row = z.object(cells).strict();
        rowShape[r.key] = strict && f.required && r.required ? row : row.optional();
      }
      const grid = z.object(rowShape).strict();
      return strict && f.required ? grid : grid.optional();
    }
    case "number": {
      const n = z
        .number({ error: "Please enter a number" })
        .int()
        .min(f.min ?? 0, `Must be at least ${f.min ?? 0}`)
        .max(f.max ?? 1000, `Must be at most ${f.max ?? 1000}`);
      return strict && f.required ? n : n.optional().nullable();
    }
  }
}

/**
 * Zod schema for a section. `strict` = required fields enforced (save &
 * mark complete); non-strict = draft save (types/lengths still enforced).
 */
export function sectionSchema(id: FormSectionId, donorType: DonorType, strict: boolean) {
  const fields = sectionFields(id, donorType);
  const shape: Record<string, z.ZodType> = {};
  for (const f of fields) shape[f.name] = fieldSchema(f, strict);
  const base = z.object(shape).strict();
  if (!strict) return base;
  return base.superRefine((values, ctx) => {
    for (const [path, message] of Object.entries(
      followUpIssues(fields, values as Record<string, unknown>),
    )) {
      ctx.addIssue({ code: "custom", path: [path], message });
    }
  });
}

/** 3–5 photos: uploaded in the pre-screen, managed later in the portal. */
export const PHOTO_LIMITS = {
  minCount: 3,
  maxCount: 5,
  maxBytes: 5 * 1024 * 1024,
  mimeTypes: ["image/jpeg", "image/png"] as const,
};

/** One optional self-introduction video (stored in `photos` with kind = "video"). */
export const VIDEO_LIMITS = {
  maxBytes: 50 * 1024 * 1024,
  mimeTypes: ["video/mp4", "video/quicktime", "video/webm"] as const,
};

/** One optional voice recording (stored in `photos` with kind = "audio"). */
export const AUDIO_LIMITS = {
  maxBytes: 20 * 1024 * 1024,
  mimeTypes: [
    "audio/mpeg",
    "audio/mp4",
    "audio/x-m4a",
    "audio/aac",
    "audio/wav",
    "audio/x-wav",
    "audio/webm",
    "audio/ogg",
  ] as const,
};

/** Rows in `photos` with these kinds are photos; "video"/"audio" are extra media. */
export const PHOTO_KINDS = ["childhood", "recent"] as const;
export const isPhotoKind = (kind: string) => (PHOTO_KINDS as readonly string[]).includes(kind);

const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/aac": "aac",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/webm": "weba",
  "audio/ogg": "ogg",
};

/** File extension used in storage for an allowed photo/video/audio type. */
export function mediaExt(contentType: string): string {
  return EXT[contentType] ?? "jpg";
}

export function completionPercent(completed: readonly string[]): number {
  const done = ALL_SECTION_IDS.filter((s) => completed.includes(s)).length;
  return Math.round((done / ALL_SECTION_IDS.length) * 100);
}

export const signatureSchema = z.object({
  signedName: z.string().trim().min(3, "Please type your full legal name").max(120),
  attest: z.literal(true, { error: "Please confirm the statement above" }),
  /** Health disclosure statement (lists are examples only; I disclosed everything I know). */
  disclose: z.literal(true, { error: "Please confirm the health disclosure statement" }),
});
