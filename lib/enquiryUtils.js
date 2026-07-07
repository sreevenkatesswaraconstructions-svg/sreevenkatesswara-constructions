const STATUS_DISPLAY_MAP = {
  NEW: 'New',
  PENDING: 'New',
  CONTACTED: 'Contacted',
  'SITE VISIT SCHEDULED': 'Site Visit Scheduled',
  'SITE_VISIT_SCHEDULED': 'Site Visit Scheduled',
  'QUOTATION REQUESTED': 'Quotation Requested',
  QUOTATION_REQUESTED: 'Quotation Requested',
  'QUOTATION SENT': 'Quotation Sent',
  QUOTATION_SENT: 'Quotation Sent',
  'FOLLOW-UP': 'Follow-up',
  FOLLOWUP: 'Follow-up',
  'FOLLOW UP': 'Follow-up',
  IN_PROGRESS: 'Follow-up',
  COMPLETED: 'Won',
  WON: 'Won',
  LOST: 'Lost',
  'ON HOLD': 'On Hold',
  ON_HOLD: 'On Hold',
  CLOSED: 'Lost',
};

const SOURCE_DISPLAY_MAP = {
  WEBSITE: 'Website',
  'WEB SITE': 'Website',
  WALKIN: 'Walk-in',
  'WALK-IN': 'Walk-in',
  'PHONE CALL': 'Phone Call',
  WHATSAPP: 'WhatsApp',
  INSTAGRAM: 'Instagram',
  FACEBOOK: 'Facebook',
  GOOGLE: 'Google',
  REFERENCE: 'Reference',
  'EXISTING CUSTOMER': 'Existing Customer',
  ARCHITECT: 'Architect',
  BUILDER: 'Builder',
  CORPORATE: 'Corporate',
  OTHER: 'Other',
};

function normalizeEnquiryStatus(status) {
  if (!status) return 'New';

  const raw = String(status).trim();
  if (!raw) return 'New';

  const directMatch = STATUS_DISPLAY_MAP[raw.toUpperCase()];
  if (directMatch) return directMatch;

  const normalizedKey = raw.toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim();
  const composedKey = normalizedKey.replace(/\s+/g, ' ');
  if (STATUS_DISPLAY_MAP[composedKey]) return STATUS_DISPLAY_MAP[composedKey];

  const knownStatuses = ['New', 'Contacted', 'Site Visit Scheduled', 'Quotation Requested', 'Quotation Sent', 'Follow-up', 'Won', 'Lost', 'On Hold'];
  return knownStatuses.includes(raw) ? raw : 'New';
}

function normalizeEnquirySource(source) {
  if (!source) return 'Website';

  const raw = String(source).trim();
  if (!raw) return 'Website';

  const directMatch = SOURCE_DISPLAY_MAP[raw.toUpperCase()];
  if (directMatch) return directMatch;

  const knownSources = ['Website', 'Walk-in', 'Phone Call', 'WhatsApp', 'Instagram', 'Facebook', 'Google', 'Reference', 'Existing Customer', 'Architect', 'Builder', 'Corporate', 'Other'];
  return knownSources.includes(raw) ? raw : 'Website';
}

function normalizeEnquiryCreatedBy(createdBy) {
  if (!createdBy) return 'Website';
  const raw = String(createdBy).trim();
  if (!raw) return 'Website';
  return raw === 'Admin' ? 'Admin' : raw;
}

function getEnquiryStatusClasses(status) {
  const normalized = normalizeEnquiryStatus(status);

  switch (normalized) {
    case 'New':
      return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
    case 'Contacted':
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
    case 'Site Visit Scheduled':
      return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
    case 'Quotation Requested':
      return 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300';
    case 'Quotation Sent':
      return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300';
    case 'Follow-up':
      return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300';
    case 'Won':
      return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
    case 'Lost':
      return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
    case 'On Hold':
      return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300';
    default:
      return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
  }
}

function getEnquiryStatusOptions() {
  return [
    { value: 'New', label: 'New' },
    { value: 'Contacted', label: 'Contacted' },
    { value: 'Site Visit Scheduled', label: 'Site Visit Scheduled' },
    { value: 'Quotation Requested', label: 'Quotation Requested' },
    { value: 'Quotation Sent', label: 'Quotation Sent' },
    { value: 'Follow-up', label: 'Follow-up' },
    { value: 'Won', label: 'Won' },
    { value: 'Lost', label: 'Lost' },
    { value: 'On Hold', label: 'On Hold' },
  ];
}

module.exports = {
  normalizeEnquiryStatus,
  normalizeEnquirySource,
  normalizeEnquiryCreatedBy,
  getEnquiryStatusClasses,
  getEnquiryStatusOptions,
};
