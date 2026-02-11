import React from 'react';
import { useTranslation } from 'react-i18next';
import { Select } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import { supportedLanguages, languageNames, SupportedLanguage } from '../../i18n';

interface Props {
  style?: React.CSSProperties;
  showLabel?: boolean;
}

export default function LanguageSwitcher({ style, showLabel = false }: Props): JSX.Element {
  const { i18n, t } = useTranslation();

  const handleChange = (value: SupportedLanguage) => {
    i18n.changeLanguage(value);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', ...style }}>
      {showLabel && (
        <span>
          <GlobalOutlined /> {t('language')}
        </span>
      )}
      <Select
        value={(i18n.language?.substring(0, 2) as SupportedLanguage) || 'en'}
        onChange={handleChange}
        style={{ minWidth: 120 }}
        size="small"
        options={supportedLanguages.map((lang) => ({
          value: lang,
          label: languageNames[lang],
        }))}
      />
    </div>
  );
}
