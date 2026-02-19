import React, { useMemo } from 'react';
import { ThemeProvider } from 'styled-components';
import { ConfigProvider as AntDesignThemeConfigProvider } from 'antd';
import { useTenantBranding } from './TenantBrandingContext';

interface Props {
  children: React.ReactNode;
}

export default function DynamicThemeProvider({ children }: Props): JSX.Element {
  const branding = useTenantBranding();

  const theme = useMemo(() => ({
    colors: {
      component: {
        primary: branding.primaryColor,
      },
      dark: {
        idle: {
          background: branding.secondaryColor,
          color: '#d0d0ff',
        },
        selection: {
          background: branding.secondaryColor,
          color: '#fff',
        },
      },
      light: {
        selection: {
          background: branding.secondaryColor,
        },
      },
      link: {
        color: branding.primaryColor,
      },
    },
    typography: {
      size: {
        heading: '1.25rem',
        heading3: '1.1rem',
      },
    },
    branding,
  }), [branding]);

  const antTheme = useMemo(() => ({
    token: {
      colorPrimary: branding.primaryColor,
      colorBorder: branding.primaryColor,
      colorLink: branding.primaryColor,
      colorLinkHover: branding.secondaryColor,
      fontSize: 14,
      borderRadius: 2,
      fontFamily: branding.fontFamily !== 'inherit' ? branding.fontFamily : undefined,
    },
  }), [branding]);

  return (
    <ThemeProvider theme={theme}>
      <AntDesignThemeConfigProvider theme={antTheme}>
        {children}
      </AntDesignThemeConfigProvider>
    </ThemeProvider>
  );
}
