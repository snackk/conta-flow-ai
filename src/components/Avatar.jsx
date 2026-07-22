import React, { useState } from 'react';
import { getInitials } from '../utils/taskLogic.js';

const SIZE_CLASSES = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
};

function stringToHue(str = '') {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}

function Avatar({ profile, size = 'md', title }) {
  const [imgError, setImgError] = useState(false);
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const initials = getInitials(profile?.firstName, profile?.lastName);
  const hue = stringToHue(profile?.uid || profile?.email || initials);

  if (profile?.photoURL && !imgError) {
    return (
      <img
        src={profile.photoURL}
        alt={title || initials}
        title={title}
        onError={() => setImgError(true)}
        className={`${sizeClass} rounded-full object-cover shrink-0 ring-2 ring-white dark:ring-slate-800 shadow-sm`}
      />
    );
  }

  return (
    <div
      title={title}
      className={`${sizeClass} rounded-full shrink-0 flex items-center justify-center font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-800`}
      style={{ backgroundColor: `hsl(${hue}, 65%, 45%)` }}
    >
      {initials}
    </div>
  );
}

export default Avatar;
