import { z } from "zod";

export type Pathway = "internship" | "volunteer" | "partnership";

export const PATHWAYS: Pathway[] = ["internship", "volunteer", "partnership"];

export const PATHWAY_META: Record<
  Pathway,
  { title: string; subtitle: string; code: string; blurb: string }
> = {
  internship: {
    title: "Internship Program",
    code: "INT",
    subtitle: "Learn inside a live logistics engine",
    blurb:
      "Structured mentorship for students and early-career talent ready to build the future of African logistics.",
  },
  volunteer: {
    title: "Volunteer Program",
    code: "VOL",
    subtitle: "Lend your expertise to the mission",
    blurb:
      "Bring your experience to purpose-driven projects across operations, technology, community, and design.",
  },
  partnership: {
    title: "Logistics Partner Registration",
    code: "PAR",
    subtitle: "Become a verified logistics partner",
    blurb:
      "For transport companies ready to register, get verified, and receive RFQs and transport assignments on the Beldium platform.",
  },
};

const nonEmpty = (label: string, max = 200) =>
  z
    .string({ required_error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be under ${max} characters`);

const optionalString = (max = 500) =>
  z.string().trim().max(max, `Must be under ${max} characters`).optional().or(z.literal(""));

const urlOptional = z
  .string()
  .trim()
  .max(300)
  .refine((v) => !v || /^https?:\/\/\S+\.\S+/.test(v), "Enter a valid URL")
  .optional()
  .or(z.literal(""));

const urlRequired = z
  .string({ required_error: "URL is required" })
  .trim()
  .min(1, "URL is required")
  .refine((v) => /^https?:\/\/\S+\.\S+/.test(v), "Enter a valid URL");

export const commonSchema = z.object({
  fullName: nonEmpty("Full name", 120),
  email: z.string().trim().email("Enter a valid email address").max(200),
  phone: nonEmpty("Phone number", 40),
  country: nonEmpty("Country", 80),
  state: nonEmpty("State / Province", 80),
  city: nonEmpty("City", 80),
  linkedin: urlRequired,
  portfolio: urlOptional,
  resumeName: nonEmpty("Resume / CV", 200),
  headshotName: optionalString(200),
});

export const internshipSchema = commonSchema.extend({
  university: nonEmpty("University / Institution", 160),
  courseOfStudy: nonEmpty("Course of study", 160),
  graduationYear: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "Enter a 4-digit year"),
  currentLevel: nonEmpty("Current level", 60),
  relevantSkills: nonEmpty("Relevant skills", 800),
  softwareExperience: nonEmpty("Software experience", 500),
  areasOfInterest: nonEmpty("Areas of interest", 500),
  motivation: nonEmpty("Motivation", 1200),
  weeklyAvailability: nonEmpty("Weekly availability", 60),
  hasLaptop: z.enum(["yes", "no"], { required_error: "Select an option" }),
  internetReliability: z.enum(["excellent", "reliable", "intermittent"], {
    required_error: "Select an option",
  }),
  earliestStartDate: nonEmpty("Earliest start date", 40),
});

export const volunteerSchema = commonSchema.extend({
  occupation: nonEmpty("Current occupation", 160),
  background: nonEmpty("Professional background", 1000),
  expertise: nonEmpty("Area of expertise", 160),
  yearsExperience: z
    .string()
    .trim()
    .regex(/^\d{1,2}$/, "Enter years as a number"),
  previousVolunteer: optionalString(1000),
  skills: nonEmpty("Skills", 800),
  weeklyAvailability: nonEmpty("Weekly availability", 60),
  motivation: nonEmpty("Motivation for joining", 1200),
  preferredTeam: nonEmpty("Preferred logistics team", 120),
  references: optionalString(600),
});

export const partnershipSchema = commonSchema.extend({
  companyName: nonEmpty("Company name", 200),
  website: urlRequired,
  industry: nonEmpty("Industry", 120),
  contactPerson: nonEmpty("Contact person", 120),
  position: nonEmpty("Position", 120),
  companySize: nonEmpty("Company size", 60),
  companyCountry: nonEmpty("Company country", 80),
  services: nonEmpty("Services offered", 800),
  fleetSize: optionalString(60),
  challenges: nonEmpty("Existing challenges", 1200),
  collaborationAreas: nonEmpty("Areas of collaboration", 800),
  expectedOutcome: nonEmpty("Expected partnership outcome", 800),
  companyProfileName: nonEmpty("Company profile document", 200),
  additionalNotes: optionalString(1200),
});

export type CommonFormValues = z.infer<typeof commonSchema>;
export type InternshipFormValues = z.infer<typeof internshipSchema>;
export type VolunteerFormValues = z.infer<typeof volunteerSchema>;
export type PartnershipFormValues = z.infer<typeof partnershipSchema>;

export function schemaFor(pathway: Pathway) {
  if (pathway === "internship") return internshipSchema;
  if (pathway === "volunteer") return volunteerSchema;
  return partnershipSchema;
}
