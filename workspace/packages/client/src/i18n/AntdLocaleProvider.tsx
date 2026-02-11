import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfigProvider } from 'antd';
import enUS from 'antd/locale/en_US';
import deDE from 'antd/locale/de_DE';
import type { Locale } from 'antd/es/locale';

const antdLocaleMap: Record<string, Locale> = {
  en: enUS,
  de: deDE,
};

interface Props {
  children: React.ReactNode;
}

export default function AntdLocaleProvider({ children }: Props): JSX.Element {
  const { i18n } = useTranslation();

  const antdLocale = useMemo(() => {
    const lang = i18n.language?.substring(0, 2) || 'en';
    return antdLocaleMap[lang] || enUS;
  }, [i18n.language]);

  return (
    <ConfigProvider locale={antdLocale}>
      {children}
    </ConfigProvider>
  );
}
