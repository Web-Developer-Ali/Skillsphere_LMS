import React from 'react';

type MobileNavButtonProps = {
  view: 'dashboard' | 'browse-courses' | 'community' | 'settings';
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  isActive: boolean;
};

export const MobileNavButton = ({ icon, label, onClick, isActive }: MobileNavButtonProps) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
      isActive
        ? 'bg-secondary dark:bg-gray-800 text-secondary-foreground dark:text-gray-100'
        : 'text-muted-foreground hover:text-primary hover:bg-gray-100 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-gray-800'
    }`}
  >
    {icon}
    {label}
  </button>
);