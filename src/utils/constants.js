export const CATEGORIES = [
  { name: 'Engine', icon: '🔧', desc: 'Pistons, Camshafts', color: 'primary' },
  { name: 'Brake', icon: '🛑', desc: 'Pads, Discs', color: 'red' },
  { name: 'Electrical', icon: '⚡', desc: 'CDI, Stators', color: 'amber' },
  { name: 'Suspension', icon: '🏍️', desc: 'Forks, Shocks', color: 'blue' },
  { name: 'Drivetrain', icon: '⚙️', desc: 'Chains, Gears', color: 'slate' },
  { name: 'Exhaust', icon: '💨', desc: 'Full Systems', color: 'orange' },
  { name: 'Body', icon: '🛡️', desc: 'Panels, Screens', color: 'indigo' },
  { name: 'Maintenance', icon: '🛠️', desc: 'Oil, Filters, Plugs', color: 'green' },
];

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const IMAGE_URL = import.meta.env.VITE_IMAGE_URL || 'http://localhost:5000';
