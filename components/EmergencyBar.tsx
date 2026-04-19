'use client';

import { Phone } from 'lucide-react';

const EMERGENCY_CONTACTS = [
  { href: 'tel:112', number: '112', label: 'Emergency' },
  { href: 'tel:102', number: '102', label: 'Ambulance' },
  { href: 'tel:104', number: '104', label: 'Health Helpline' },
];

export default function EmergencyBar() {
  return (
    <div className="md:hidden sticky bottom-0 bg-red-600 text-white w-full flex z-50">
      {EMERGENCY_CONTACTS.map((contact, index) => (
        <a
          key={contact.number}
          href={contact.href}
          className={`flex-1 flex flex-col items-center justify-center py-2 text-white border-r border-red-500 last:border-0`}
          style={{ textDecoration: 'none' }}
        >
          <Phone size={14} />
          <span className="text-base font-bold leading-tight mt-0.5">{contact.number}</span>
          <span className="text-xs opacity-80 leading-tight">{contact.label}</span>
        </a>
      ))}
    </div>
  );
}
