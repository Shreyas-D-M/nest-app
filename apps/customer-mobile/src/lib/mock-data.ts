export type Category = {
  id: string;
  name: string;
  description: string;
};

export type Professional = {
  id: string;
  name: string;
  business: string;
  rating: number;
  trustScore: number;
  distanceKm: number;
  etaMinutes: number;
  priceFrom: number;
  availability: 'Available now' | 'In 18 min' | 'In 35 min';
  experience: number;
  tags: string[];
};

export const categories: Category[] = [
  { id: 'plumbing', name: 'Plumbing', description: 'Leaks, taps, flush, water heaters' },
  { id: 'electrical', name: 'Electrical', description: 'Switches, wiring, fan and lighting' },
  { id: 'ac-repair', name: 'AC repair', description: 'Cooling, servicing and gas top-up' },
  { id: 'cleaning', name: 'Cleaning', description: 'Deep cleaning, sanitisation and maintenance' },
  { id: 'appliance', name: 'Appliance', description: 'Washing machines, chimneys and ovens' },
];

export const professionals: Professional[] = [
  {
    id: 'ashak',
    name: 'Asha K.',
    business: 'NEST Home Care',
    rating: 4.9,
    trustScore: 94,
    distanceKm: 1.6,
    etaMinutes: 18,
    priceFrom: 499,
    availability: 'Available now',
    experience: 8,
    tags: ['Verified', 'Same area', 'Top rated'],
  },
  {
    id: 'riteshs',
    name: 'Ritesh S.',
    business: 'Quick Fix Plumbing',
    rating: 4.8,
    trustScore: 91,
    distanceKm: 2.1,
    etaMinutes: 35,
    priceFrom: 549,
    availability: 'In 18 min',
    experience: 6,
    tags: ['Fast response', 'Family home', 'Popular'],
  },
  {
    id: 'naveenp',
    name: 'Naveen P.',
    business: 'Belagavi Electrical',
    rating: 4.7,
    trustScore: 89,
    distanceKm: 2.8,
    etaMinutes: 42,
    priceFrom: 699,
    availability: 'In 35 min',
    experience: 11,
    tags: ['Licensed', 'Clear pricing', 'Reviews'],
  },
];

export const favoriteProfessionals = [
  { id: 'ashak', name: 'Asha K.', service: 'Water purifier', lastBooked: 'Booked 2 weeks ago' },
  { id: 'riteshs', name: 'Ritesh S.', service: 'Tap leak', lastBooked: 'Booked last month' },
];

export const bookingHistory = [
  {
    id: 'BK-1042',
    service: 'AC tune-up',
    status: 'Completed',
    date: '12 Aug 2026',
    amount: '₹1,290',
  },
  {
    id: 'BK-1027',
    service: 'Ceiling fan repair',
    status: 'Paid',
    date: '2 Aug 2026',
    amount: '₹710',
  },
  {
    id: 'BK-0994',
    service: 'Water purifier service',
    status: 'Reviewed',
    date: '28 Jul 2026',
    amount: '₹880',
  },
];

export const notifications = [
  {
    id: 'n1',
    title: 'Professional arrived',
    body: 'Asha K. has reached your home and is on the way to the kitchen.',
    read: false,
  },
  {
    id: 'n2',
    title: 'Extra work request',
    body: 'A safety check for your geyser has been requested for ₹480.',
    read: false,
  },
  {
    id: 'n3',
    title: 'Invoice ready',
    body: 'Your latest AC service invoice is available for review.',
    read: true,
  },
];

export const homePassportItems = [
  { id: 'hp1', name: 'Water purifier', due: 'Filter due in 9 days', status: 'Maintenance due' },
  { id: 'hp2', name: 'AC unit', due: 'Service due in 27 days', status: 'On track' },
  { id: 'hp3', name: 'Geyser', due: 'Annual inspection due in 68 days', status: 'Healthy' },
];

export const supportTopics = [
  'Booking issue',
  'Payment and invoice',
  'Professional quality',
  'Safety concern',
  'General help',
];
