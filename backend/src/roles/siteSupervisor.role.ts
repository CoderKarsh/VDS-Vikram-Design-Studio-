import { RoleData } from "../models/Role";

export const SiteSupervisorRole: RoleData = {
  roleName: "Site Supervisor",
  slug: "site-supervisor",
  department: "Engineering",

  cities: {
    Kolkata: true,
    Guwahati: true,
  },

  /* =========================
     JOB METADATA (READ ONLY)
  ========================== */

  jobDescription:
    "We are looking for a Site Supervisor with strong on-site execution and coordination skills to oversee architectural and interior projects across varied scales and typologies. The role involves managing day-to-day site activities, ensuring drawings are executed accurately, and coordinating between contractors, consultants, and the studio team. The ideal candidate is proactive, detail-oriented, and comfortable working in a dynamic site environment.",

  responsibilities: [
    "Supervise daily site activities and ensure work is executed as per drawings and specifications.",
    "Coordinate with contractors, vendors, and consultants on site.",
    "Monitor quality, timelines, and site safety.",
    "Verify measurements, materials, and workmanship.",
    "Report progress and issues regularly to the studio team.",
    "Assist in resolving technical and execution-related challenges on site.",
  ],

  requirements: [
    "Diploma/Degree in Civil Engineering, Architecture, or related field.",
    "1–5 years of relevant site experience.",
    "Strong understanding of construction methods and materials.",
    "Ability to read and interpret drawings clearly.",
    "Good coordination and communication skills.",
    "Willingness to work full-time on site when required.",
    "Willingness to travel to remote sites when required.",
  ],

  /* =========================
     APPLICATION FORM FIELDS
  ========================== */

  fields: [
    /* 1. Personal Details */
    {
      name: "fullName",
      label: "Full Name",
      type: "text",
      required: true,
      section: "Personal Details",
    },
    {
      name: "dateOfBirth",
      label: "Date of Birth",
      type: "date",
      required: true,
      section: "Personal Details",
    },
    {
      name: "email",
      label: "Email Address",
      type: "email",
      required: true,
      section: "Personal Details",
    },
    {
      name: "mobileNumber",
      label: "Mobile Number",
      type: "text",
      required: true,
      section: "Personal Details",
    },
    {
      name: "country",
      label: "Country",
      type: "select",
      required: true,
      section: "Personal Details",
    },
    {
      name: "state",
      label: "State",
      type: "select",
      required: true,
      section: "Personal Details",
    },
    {
      name: "city",
      label: "City",
      type: "select",
      required: true,
      section: "Personal Details",
    },
    {
      name: "linkedin",
      label: "LinkedIn Profile",
      type: "text",
      required: false,
      section: "Personal Details",
    },

    /* 2. Education & Credentials */
    {
      name: "highestQualification",
      label: "Highest Qualification",
      type: "select",
      required: true,
      options: [
        "Bachelor’s Degree",
        "Master’s Degree",
        "Diploma",
        "Professional Certification",
        "Other",
      ],
      section: "Education & Credentials",
    },
    {
      name: "institution",
      label: "Institution",
      type: "text",
      required: true,
      section: "Education & Credentials",
    },
    {
      name: "graduationYear",
      label: "Graduation Year",
      type: "number",
      required: true,
      section: "Education & Credentials",
    },
    {
      name: "professionalCertification",
      label: "Professional Certification (if any)",
      type: "text",
      required: false,
      section: "Education & Credentials",
    },

    /* 3. Professional Profile */
    {
      name: "totalExperience",
      label: "Total Years of Experience",
      type: "number",
      required: true,
      section: "Professional Profile",
    },
    {
      name: "relevantSiteExperience",
      label: "Relevant Experience as Site Supervisor (years)",
      type: "number",
      required: true,
      section: "Professional Profile",
    },
    {
      name: "currentOrganization",
      label: "Current Organization",
      type: "text",
      required: true,
      section: "Professional Profile",
    },
    {
      name: "currentDesignation",
      label: "Current Designation",
      type: "text",
      required: true,
      section: "Professional Profile",
    },

    /* 4. Project Experience (OPTIONAL) */
    {
      name: "projectTypes",
      label: "Primary Project Types Worked On",
      type: "checkbox",
      required: false,
      options: [
        "Residential",
        "Commercial",
        "Institutional",
        "Hospitality",
        "Mixed-use",
      ],
      section: "Project Experience",
    },
    {
      name: "largestProject",
      label: "Largest Project Handled (area or value)",
      type: "text",
      required: false,
      section: "Project Experience",
    },
    {
      name: "projectRole",
      label: "Your Role in That Project",
      type: "textarea",
      required: false,
      section: "Project Experience",
    },

    /* 5. Skills & Tools */
    {
      name: "autocad",
      label: "AutoCAD Proficiency",
      type: "radio",
      required: true,
      options: ["Advanced", "Intermediate", "Beginner", "No Experience"],
      section: "Skills & Tools",
    },
    {
      name: "msExcel",
      label: "MS Excel Proficiency",
      type: "radio",
      required: true,
      options: ["Advanced", "Intermediate", "Beginner", "No Experience"],
      section: "Skills & Tools",
    },
    {
      name: "otherSoftware",
      label: "Other Software & Proficiency",
      type: "text",
      required: false,
      section: "Skills & Tools",
    },

    /* 6. Attachments */
    {
      name: "cvFile",
      label: "Upload CV (PDF, max 1MB)",
      type: "file",
      required: true,
      section: "Attachments",
    },

    /* 7. Additional Information */
    {
      name: "noticePeriod",
      label: "Notice Period",
      type: "text",
      required: true,
      placeholder: " If not currently employed, write “Not Applicable”",
      section: "Additional Information",
    },

    {
      name: "joiningDate",
      label: "Earliest Possible Joining Date",
      type: "date",
      required: true,
      section: "Additional Information",
    },
    {
      name: "desiredCompensation",
      label: "Desired Compensation (Annual CTC in INR)",
      type: "number",
      required: true,
      section: "Additional Information",
    },
    {
      name: "whyUs",
      label: "Why would you like to work with us?",
      type: "textarea",
      required: true,
      section: "Additional Information",
    },

    /* 8. Declaration & Consent */
    {
      name: "declaration",
      label: "Please confirm your agreement to the following:",
      type: "checkbox",
      required: true,
      options: [
        "I hereby declare that all the information provided in this application is true, complete, and accurate to the best of my knowledge. I understand that any false information may result in disqualification or termination of employment.",
      ],
      section: "Declaration & Consent",
    },
    {
      name: "dataConsent",
      label: "",
      type: "checkbox",
      required: true,
      options: [
        "I consent to the processing of my personal data for recruitment purposes and understand that my information will be handled in accordance with applicable data protection laws.",
      ],
      section: "Declaration & Consent",
    },
    {
      name: "assessmentConsent",
      label: "Design & Technical Assessment:",
      type: "checkbox",
      required: true,
      options: [
        "I understand that if shortlisted, I will be required to complete a 24-hour design/technical assessment relevant to the Architect role as part of the selection process.",
      ],
      section: "Declaration & Consent",
    },
  ],
};
