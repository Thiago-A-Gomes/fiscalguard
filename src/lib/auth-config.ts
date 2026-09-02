import type { Configuration } from '@azure/msal-browser';

const clientId = import.meta.env.VITE_AZURE_CLIENT_ID ?? '';
const tenantId = import.meta.env.VITE_AZURE_TENANT_ID ?? '';

export const isEntraConfigured = Boolean(clientId && tenantId);

export const msalConfig: Configuration = {
  auth: {
    clientId: clientId || 'not-configured',
    authority: tenantId ? `https://login.microsoftonline.com/${tenantId}` : 'https://login.microsoftonline.com/common',
    redirectUri: import.meta.env.VITE_AZURE_REDIRECT_URI || window.location.origin,
  },
  cache: { cacheLocation: 'sessionStorage' },
};
