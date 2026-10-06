// CertWise - issuers we recognise, and the words that tell us which job field a certificate belongs to.
//
// This is what lets CertWise score a certificate that is NOT in data/certs.js: when the issuer's own
// record (Credly, Coursera, edX) names the certificate, we look the ISSUER up here instead of needing
// the certificate itself in our list. One line here covers every certificate that issuer gives.
//
// type : the same meaning as issuerType in data/certs.js
//        "vendor"   = the company / body whose technology or field it tests
//        "academic" = IIT / IISc / NPTEL
//        "platform" = a learning platform or a company's free learning programme
// match: lowercase words; the issuer's name must contain one of them as whole words
// anywhere: true = also look in the badge's own text (for programmes that issue under the parent
//        company's name, e.g. Cisco Networking Academy badges are issued by "Cisco")
//
// Order matters: the first match wins, so programmes come before their parent company.

const KNOWN_ISSUERS = [
  // ---------- learning programmes and platforms ----------
  { name: "Cisco Networking Academy", type: "platform", match: ["networking academy", "netacad"], anywhere: true },
  { name: "IBM SkillsBuild", type: "platform", match: ["skillsbuild"], anywhere: true },
  { name: "Coursera", type: "platform", match: ["coursera"] },
  { name: "edX", type: "platform", match: ["edx"] },
  { name: "Udemy", type: "platform", match: ["udemy"] },
  { name: "Udacity", type: "platform", match: ["udacity"] },
  { name: "LinkedIn Learning", type: "platform", match: ["linkedin"] },
  { name: "Pluralsight", type: "platform", match: ["pluralsight"] },
  { name: "freeCodeCamp", type: "platform", match: ["freecodecamp"] },
  { name: "HackerRank", type: "platform", match: ["hackerrank"] },
  { name: "Kaggle", type: "platform", match: ["kaggle"] },
  { name: "DataCamp", type: "platform", match: ["datacamp"] },
  { name: "Codecademy", type: "platform", match: ["codecademy"] },
  { name: "Simplilearn", type: "platform", match: ["simplilearn"] },
  { name: "Great Learning", type: "platform", match: ["great learning"] },
  { name: "upGrad", type: "platform", match: ["upgrad"] },
  { name: "Infosys Springboard", type: "platform", match: ["infosys"] },
  { name: "TCS iON", type: "platform", match: ["tcs"] },
  { name: "Forage", type: "platform", match: ["forage"] },
  { name: "Internshala", type: "platform", match: ["internshala"] },

  // ---------- IIT / IISc ----------
  { name: "NPTEL", type: "academic", match: ["nptel", "swayam", "indian institute of technology", "indian institute of science"] },

  // ---------- companies and bodies that own the field they certify ----------
  { name: "Amazon Web Services", type: "vendor", match: ["amazon web services", "aws"] },
  { name: "Microsoft", type: "vendor", match: ["microsoft"] },
  { name: "Google Cloud", type: "vendor", match: ["google cloud", "google"] },
  { name: "Cisco", type: "vendor", match: ["cisco"] },
  { name: "IBM", type: "vendor", match: ["ibm"] },
  { name: "Oracle", type: "vendor", match: ["oracle"] },
  { name: "Red Hat", type: "vendor", match: ["red hat"] },
  { name: "CompTIA", type: "vendor", match: ["comptia"] },
  { name: "ISC2", type: "vendor", match: ["isc2", "isc"] },
  { name: "EC-Council", type: "vendor", match: ["ec council", "eccouncil"] },
  { name: "The Linux Foundation", type: "vendor", match: ["linux foundation", "cloud native computing foundation", "cncf"] },
  { name: "HashiCorp", type: "vendor", match: ["hashicorp"] },
  { name: "VMware", type: "vendor", match: ["vmware"] },
  { name: "Salesforce", type: "vendor", match: ["salesforce"] },
  { name: "SAP", type: "vendor", match: ["sap"] },
  { name: "Adobe", type: "vendor", match: ["adobe"] },
  { name: "Palo Alto Networks", type: "vendor", match: ["palo alto"] },
  { name: "Fortinet", type: "vendor", match: ["fortinet"] },
  { name: "Juniper Networks", type: "vendor", match: ["juniper"] },
  { name: "NVIDIA", type: "vendor", match: ["nvidia"] },
  { name: "Meta", type: "vendor", match: ["meta"] },
  { name: "Databricks", type: "vendor", match: ["databricks"] },
  { name: "Snowflake", type: "vendor", match: ["snowflake"] },
  { name: "MongoDB", type: "vendor", match: ["mongodb"] },
  { name: "GitHub", type: "vendor", match: ["github"] },
  { name: "Project Management Institute", type: "vendor", match: ["project management institute", "pmi"] },
  { name: "ISACA", type: "vendor", match: ["isaca"] },
  { name: "Scrum Alliance", type: "vendor", match: ["scrum alliance", "scrum org"] },
  { name: "Autodesk", type: "vendor", match: ["autodesk"] },
  { name: "Tableau", type: "vendor", match: ["tableau"] },
  { name: "Splunk", type: "vendor", match: ["splunk"] },
  { name: "Atlassian", type: "vendor", match: ["atlassian"] },
  { name: "ServiceNow", type: "vendor", match: ["servicenow"] },
  { name: "Nutanix", type: "vendor", match: ["nutanix"] },
  { name: "Intel", type: "vendor", match: ["intel"] },
  { name: "Dell Technologies", type: "vendor", match: ["dell"] },
  { name: "Hewlett Packard Enterprise", type: "vendor", match: ["hewlett packard", "hpe"] },
  { name: "Huawei", type: "vendor", match: ["huawei"] },
  { name: "Alibaba Cloud", type: "vendor", match: ["alibaba"] },
  { name: "Docker", type: "vendor", match: ["docker"] },
  { name: "Elastic", type: "vendor", match: ["elastic"] },
  { name: "Confluent", type: "vendor", match: ["confluent"] },
  { name: "Unity", type: "vendor", match: ["unity"] },
  { name: "OffSec", type: "vendor", match: ["offsec", "offensive security"] },
  { name: "GIAC", type: "vendor", match: ["giac", "sans institute"] },
  { name: "CrowdStrike", type: "vendor", match: ["crowdstrike"] },
  { name: "Okta", type: "vendor", match: ["okta"] },
  { name: "Zscaler", type: "vendor", match: ["zscaler"] },
  { name: "Check Point", type: "vendor", match: ["check point"] },
  { name: "UiPath", type: "vendor", match: ["uipath"] }
];

// words that point to each job field (the role ids are the ones in data/certs.js).
// A word ending in * matches any word that starts with it; the others must appear as whole words.
const FIELD_WORDS = {
  cloud: ["cloud", "aws", "azure", "devops", "kubernetes", "docker", "terraform", "linux", "serverless", "containers",
          "infrastructure", "site reliability", "virtualization", "networking", "network"],
  sec:   ["security", "cybersecurity", "cyber", "threat*", "penetration", "ethical hacking", "forensic*", "incident response",
          "vulnerabilit*", "cryptograph*", "malware", "firewall*", "privacy"],
  data:  ["data analysis", "data analytics", "analytics", "sql", "power bi", "tableau", "excel", "statistics",
          "data visualization", "business intelligence", "database*", "spreadsheet*"],
  ai:    ["machine learning", "artificial intelligence", "ai", "deep learning", "generative", "llm", "nlp", "neural",
          "data science", "prompt", "computer vision", "chatgpt"],
  web:   ["web", "html", "css", "javascript", "react", "front end", "frontend", "ui", "ux", "node js", "angular",
          "full stack", "responsive"],
  dev:   ["python", "java", "programming", "software", "algorithm*", "git", "github", "coding", "developer",
          "object oriented", "data structures", "api", "version control"]
};

// where the "how it is earned" rule for Coursera comes from (Coursera's own blog)
const COURSERA_GRADED_SRC = {
  name: "Coursera blog: required graded assignments and the Course Certificate",
  url: "https://blog.coursera.org/an-update-on-enrollment-and-grading-options-on/"
};

if (typeof module !== "undefined") {
  module.exports = { KNOWN_ISSUERS, FIELD_WORDS, COURSERA_GRADED_SRC };
}
