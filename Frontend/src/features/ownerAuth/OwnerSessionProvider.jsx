import React from 'react';

/**
 * Pass-through kept for backward compatibility; unified AuthProvider lives at app root.
 */
export function OwnerSessionProvider({ children }) {
  return <>{children}</>;
}
