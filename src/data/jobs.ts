/** Open positions on /careers. Edit copy here; layout lives in JobCard. */
export type Job = {
  title: string;
  location: string;
  type: string;
  pay: string;
  benefits: string[];
  summary: string;
  duties: string[];
  reqs: string[];
  howToApply: string;
};

export const JOB_NOTICE = {
  title: "Security and confidentiality",
  body: [
    "Traction X operates a secure, confidential workplace because of the nature of the clients we serve. Discretion is a core requirement of every role.",
    "All employees must sign confidentiality and non-disclosure agreements before starting work.",
    "A background check is a condition of hire. Offers are contingent on satisfactory results.",
    "Professional references are required (minimum of three, including at least one recent supervisor).",
    "Prior experience in a similar role is strongly preferred.",
  ],
};

export const APPLY_EMAIL = "info@tractionx.ca";

const OFFER = [
  "A competitive benefits package",
  "Full-time, stable employment with a growing company",
  "Paid time off",
  "Professional, well-organized work environment with high standards",
  "Opportunities for growth as the company expands",
];

const apply = (role: string) =>
  `Apply with your resume and a brief cover letter for the ${role} position. Please include the names of three professional references. Only candidates selected for an interview will be contacted. All applications are handled in confidence.`;

export const JOBS: Job[] = [
  {
    title: "Cabinet Maker",
    location: "Vancouver, BC",
    type: "Full-time, permanent",
    pay: "CA$27 to CA$37 per hour, based on experience",
    benefits: OFFER,
    summary:
      "We are seeking an experienced Cabinet Maker to fabricate high-quality custom millwork, casework and components for custom booth builds in our trade show exhibit fabrication shop. You will work from shop drawings to produce precise, finished pieces that meet strict quality and deadline standards.",
    duties: [
      "Read and interpret shop drawings, CAD files and cut lists",
      "Build custom cabinets, casework, counters and exhibit structures from sheet goods, hardwood and laminates",
      "Operate panel saws, edge banders, routers and standard shop tools safely, and work with CNC-machined parts",
      "Apply laminates, veneers and hardware to a finished, client-ready standard, detailing millwork for disassembly and reuse rather than single-use glued assemblies",
      "Assemble and test-fit exhibit components for full in-shop pre-builds, where the finished booth is photographed for client approval before crating, freight and convention centre installs",
      "Maintain a clean, safe and organized work area and follow all safety procedures",
      "Coordinate with the shop lead and project team on schedules and quality",
    ],
    reqs: [
      "5+ years of professional cabinet making or millwork experience (trade show exhibit fabrication, retail fixture or architectural millwork experience strongly preferred)",
      "Strong ability to read shop drawings and measure accurately",
      "Proficiency with woodworking machinery and hand tools; CNC experience is an asset",
      "Attention to detail and pride in finished work",
      "Reliable, punctual and able to meet deadlines",
      "Own basic hand tools preferred",
      "Must be legally entitled to work in Canada",
    ],
    howToApply: apply("Cabinet Maker"),
  },
  {
    title: "Shipping and Receiving Associate",
    location: "Long Beach, CA",
    type: "Full-time, permanent",
    pay: "US$27 to US$37 per hour, based on experience",
    benefits: OFFER,
    summary:
      "We are seeking a dependable Shipping and Receiving Associate to manage the inbound and outbound freight of trade show exhibit properties, custom booth crates and materials at our Long Beach warehouse, supporting event logistics for shows nationwide. Accuracy, security and care in handling client property are essential.",
    duties: [
      "Receive, inspect, count and record incoming shipments and returning exhibit crates",
      "Prepare, pack, crate, label and stage outbound freight for trade shows, events and convention centre installs",
      "Load and unload trucks safely using forklifts, pallet jacks and dollies",
      "Track every crate, panel, light fixture and graphic against numbered asset lists with a photo record, and maintain accurate warehouse locations",
      "Prepare and verify bills of lading, packing lists and freight documents, and coordinate with carriers on event logistics",
      "Log crate condition at check-in and check-out of every show, and report damage, discrepancies and shortages promptly",
      "Support climate-controlled storage, return of reusable components to inventory, and a clean, organized, secure warehouse that meets safety standards",
    ],
    reqs: [
      "5+ years of shipping, receiving or warehouse experience (trade show exhibit, freight or event logistics experience strongly preferred)",
      "Forklift certification or ability to obtain it",
      "Strong organizational skills and accuracy with paperwork and inventory systems",
      "Able to lift up to 50 lbs and work on your feet",
      "Basic computer skills",
      "Reliable, punctual and detail oriented",
      "Must be legally authorized to work in the United States",
    ],
    howToApply: apply("Shipping and Receiving Associate"),
  },
  {
    title: "Event Install Supervisor",
    location: "Toronto, ON",
    type: "Full-time, permanent",
    pay: "CA$65,000 to CA$95,000 per year, based on experience",
    benefits: OFFER,
    summary:
      "We are seeking an experienced Event Install Supervisor (exhibit install supervisor, Toronto) to lead the on-site installation and dismantle of custom booth builds, trade show exhibits and event environments at convention centres across North America. You will plan labour, lead crews and ensure every installation is completed safely, on time and to a flawless standard.",
    duties: [
      "Plan and schedule labour, equipment, event logistics and freight for each convention centre install and dismantle",
      "Serve as the on-site lead from crate open to the final walk, supervising certified, insured union and non-union install crews",
      "Review exhibit design and production drawings, millwork, graphics and setup instructions before each project",
      "Coordinate with the project management team, show contractors, venues and freight carriers",
      "Enforce safety procedures, venue rules and jurisdiction requirements, with badging and EAC paperwork handled in advance",
      "Resolve on-site issues quickly and professionally",
      "Manage shift lengths to avoid unnecessary overtime, track labour hours, and complete dismantle, re-crating to spec and outbound hand-off the same night",
      "Travel to show sites across North America as required",
    ],
    reqs: [
      "5+ years of trade show, exhibit or event installation experience, including 2+ years in a supervisory role (strongly preferred)",
      "Strong knowledge of trade show exhibit fabrication, exhibit systems, millwork, graphics, lighting and rigging",
      "Proven leadership of crews and contractors",
      "Excellent planning, communication and problem-solving skills",
      "Willingness to travel frequently and work extended hours during show periods",
      "Valid driver's licence and passport",
      "Must be legally entitled to work in Canada",
    ],
    howToApply: apply("Event Install Supervisor"),
  },
  {
    title: "Project Manager",
    location: "Toronto, ON",
    type: "Full-time, permanent",
    pay: "CA$75,000 to CA$115,000 per year, based on experience",
    benefits: OFFER,
    summary:
      "We are seeking an experienced Project Manager to lead custom booth builds and trade show exhibit projects from award through delivery. You will be the primary point of contact for assigned accounts and will manage scope, schedule, budget and quality across exhibit design and production, millwork and CNC fabrication, event logistics, freight and convention centre installs.",
    duties: [
      "Manage multiple exhibit projects simultaneously from kickoff to close-out",
      "Serve as the single accountable point of contact for clients, with design, fabrication, freight, install and dismantle on one contract",
      "Develop and manage project schedules, budgets and scopes of work",
      "Coordinate exhibit design, production, graphics, freight and installation teams, including sustainable materials options for clients",
      "Manage show orders, deadlines, vendor and subcontractor relationships",
      "Review photoreal 3D designs, floor plans, drawings and costed scopes for accuracy, and manage client approval of in-shop pre-build photos before shipping",
      "Hold to fixed, signed scopes, issue written change orders for client approval before work proceeds, and report project status",
      "Attend shows on site as required",
    ],
    reqs: [
      "5+ years of project management experience in trade show exhibit fabrication, events, millwork or a related custom fabrication environment (strongly preferred)",
      "Proven ability to manage budgets, schedules and multiple deadlines",
      "Excellent written and verbal communication skills",
      "Ability to read drawings; familiarity with AutoCAD or similar tools is an asset",
      "Proficiency with Microsoft Office and project management tools",
      "Highly organized, discreet and client focused",
      "Willingness to travel as required",
      "Must be legally entitled to work in Canada",
    ],
    howToApply: apply("Project Manager"),
  },
];
