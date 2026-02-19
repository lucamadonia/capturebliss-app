import React, { createContext, useContext, useMemo, useEffect } from 'react';
import { useSelector } from 'react-redux';

interface WhiteLabelData {
  appName?: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  customDomain?: string;
  hidePoweredBy?: boolean;
  customCss?: string;
  loginBackground?: string;
  supportEmail?: string;
  supportUrl?: string;
}

interface TState {
  default: {
    org: { info?: { whiteLabel?: WhiteLabelData } } | null;
  };
}

interface TenantBranding {
  appName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  hidePoweredBy: boolean;
  customCss: string | null;
  supportEmail: string | null;
  supportUrl: string | null;
}

const DEFAULT_BRANDING: TenantBranding = {
  appName: 'Capturebliss',
  logoUrl: null,
  faviconUrl: null,
  primaryColor: '#7567ff',
  secondaryColor: '#160245',
  accentColor: '#7567ff',
  fontFamily: 'inherit',
  hidePoweredBy: false,
  customCss: null,
  supportEmail: null,
  supportUrl: null,
};

const TenantBrandingContext = createContext<TenantBranding>(DEFAULT_BRANDING);

export function useTenantBranding(): TenantBranding {
  return useContext(TenantBrandingContext);
}

interface Props {
  children: React.ReactNode;
}

export default function TenantBrandingProvider({ children }: Props): JSX.Element {
  const whiteLabel = useSelector((state: TState) => state.default.org?.info?.whiteLabel);

  const branding = useMemo<TenantBranding>(() => {
    if (!whiteLabel) return DEFAULT_BRANDING;
    return {
      appName: whiteLabel.appName || DEFAULT_BRANDING.appName,
      logoUrl: whiteLabel.logoUrl || DEFAULT_BRANDING.logoUrl,
      faviconUrl: whiteLabel.faviconUrl || DEFAULT_BRANDING.faviconUrl,
      primaryColor: whiteLabel.primaryColor || DEFAULT_BRANDING.primaryColor,
      secondaryColor: whiteLabel.secondaryColor || DEFAULT_BRANDING.secondaryColor,
      accentColor: whiteLabel.accentColor || DEFAULT_BRANDING.accentColor,
      fontFamily: whiteLabel.fontFamily || DEFAULT_BRANDING.fontFamily,
      hidePoweredBy: whiteLabel.hidePoweredBy || DEFAULT_BRANDING.hidePoweredBy,
      customCss: whiteLabel.customCss || DEFAULT_BRANDING.customCss,
      supportEmail: whiteLabel.supportEmail || DEFAULT_BRANDING.supportEmail,
      supportUrl: whiteLabel.supportUrl || DEFAULT_BRANDING.supportUrl,
    };
  }, [whiteLabel]);

  // Apply dynamic CSS custom properties
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--cb-primary', branding.primaryColor);
    root.style.setProperty('--cb-secondary', branding.secondaryColor);
    root.style.setProperty('--cb-accent', branding.accentColor);
    root.style.setProperty('--cb-font-family', branding.fontFamily);

    // Update page title
    document.title = document.title.replace(/Capturebliss/g, branding.appName);

    // Update favicon if custom one is set
    if (branding.faviconUrl) {
      const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement
        || document.createElement('link');
      link.rel = 'icon';
      link.href = branding.faviconUrl;
      document.head.appendChild(link);
    }

    // Inject custom CSS if set
    if (branding.customCss) {
      let styleEl = document.getElementById('tenant-custom-css');
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'tenant-custom-css';
        document.head.appendChild(styleEl);
      }
      styleEl.textContent = branding.customCss;
    }
  }, [branding]);

  return (
    <TenantBrandingContext.Provider value={branding}>
      {children}
    </TenantBrandingContext.Provider>
  );
}
