import React from 'react';

function NavItem({ icon, label, active, onClick, collapsed = false }) {
  return (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-colors ${collapsed ? 'justify-center px-0' : ''} ${
        active
          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
      }`}
    >
      <span className="w-5 h-5 shrink-0 [&>svg]:w-5 [&>svg]:h-5">{icon}</span>
      {!collapsed && label}
    </button>
  );
}

export default NavItem;
