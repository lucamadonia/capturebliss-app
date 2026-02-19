import React, { useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Input, Switch, Button, ColorPicker, message, Divider, Typography } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import api from '@capturebliss/common/dist/api';
import { ApiResp, ReqUpdateOrg, RespOrg } from '@capturebliss/common/dist/api-contract';
import ActionType from '../../action/type';

const { TextArea } = Input;
const { Title, Text } = Typography;

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
    org: RespOrg | null;
  };
}

export default function WhiteLabelSettings(): JSX.Element {
  const dispatch = useDispatch();
  const org = useSelector((state: TState) => state.default.org);
  const currentConfig: WhiteLabelData = org?.info?.whiteLabel || {};

  const [config, setConfig] = useState<WhiteLabelData>({
    appName: currentConfig.appName || '',
    logoUrl: currentConfig.logoUrl || '',
    faviconUrl: currentConfig.faviconUrl || '',
    primaryColor: currentConfig.primaryColor || '#7567ff',
    secondaryColor: currentConfig.secondaryColor || '#160245',
    accentColor: currentConfig.accentColor || '#7567ff',
    fontFamily: currentConfig.fontFamily || '',
    hidePoweredBy: currentConfig.hidePoweredBy || false,
    customCss: currentConfig.customCss || '',
    supportEmail: currentConfig.supportEmail || '',
    supportUrl: currentConfig.supportUrl || '',
  });

  const [saving, setSaving] = useState(false);

  const updateField = useCallback((field: keyof WhiteLabelData, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const data = await api<ReqUpdateOrg, ApiResp<RespOrg>>('/updtorgprops', {
        auth: true,
        method: 'POST',
        body: {
          orgInfo: {
            ...(org?.info || {}),
            whiteLabel: config,
          },
        },
      });
      dispatch({ type: ActionType.ORG, org: data.data });
      message.success('White-Label settings saved');
    } catch (e: any) {
      message.error('Failed to save: ' + (e?.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  }, [config, org, dispatch]);

  const fieldStyle: React.CSSProperties = { marginBottom: '1rem' };
  const labelStyle: React.CSSProperties = { display: 'block', marginBottom: '0.25rem', fontWeight: 500 };

  return (
    <div style={{ maxWidth: 640 }}>
      <Title level={5}>White-Label / Branding</Title>
      <Text type="secondary">
        Customize the appearance of your workspace. These settings apply to all users in your organization.
      </Text>

      <Divider orientation="left" plain>General</Divider>

      <div style={fieldStyle}>
        <label style={labelStyle}>App Name</label>
        <Input
          value={config.appName}
          onChange={e => updateField('appName', e.target.value)}
          placeholder="e.g. My Company Demos"
        />
        <Text type="secondary" style={{ fontSize: 12 }}>
          Replaces "Capturebliss" throughout the app for your organization.
        </Text>
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Logo URL</label>
        <Input
          value={config.logoUrl}
          onChange={e => updateField('logoUrl', e.target.value)}
          placeholder="https://example.com/logo.png"
        />
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Favicon URL</label>
        <Input
          value={config.faviconUrl}
          onChange={e => updateField('faviconUrl', e.target.value)}
          placeholder="https://example.com/favicon.ico"
        />
      </div>

      <Divider orientation="left" plain>Colors</Divider>

      <div style={{ display: 'flex', gap: '2rem', ...fieldStyle }}>
        <div>
          <label style={labelStyle}>Primary Color</label>
          <ColorPicker
            value={config.primaryColor}
            onChange={(_, hex) => updateField('primaryColor', hex)}
          />
        </div>
        <div>
          <label style={labelStyle}>Secondary Color</label>
          <ColorPicker
            value={config.secondaryColor}
            onChange={(_, hex) => updateField('secondaryColor', hex)}
          />
        </div>
        <div>
          <label style={labelStyle}>Accent Color</label>
          <ColorPicker
            value={config.accentColor}
            onChange={(_, hex) => updateField('accentColor', hex)}
          />
        </div>
      </div>

      <Divider orientation="left" plain>Typography</Divider>

      <div style={fieldStyle}>
        <label style={labelStyle}>Font Family</label>
        <Input
          value={config.fontFamily}
          onChange={e => updateField('fontFamily', e.target.value)}
          placeholder="e.g. Inter, Roboto, sans-serif"
        />
      </div>

      <Divider orientation="left" plain>Support</Divider>

      <div style={fieldStyle}>
        <label style={labelStyle}>Support Email</label>
        <Input
          value={config.supportEmail}
          onChange={e => updateField('supportEmail', e.target.value)}
          placeholder="support@yourcompany.com"
        />
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Support URL</label>
        <Input
          value={config.supportUrl}
          onChange={e => updateField('supportUrl', e.target.value)}
          placeholder="https://help.yourcompany.com"
        />
      </div>

      <Divider orientation="left" plain>Advanced</Divider>

      <div style={fieldStyle}>
        <label style={labelStyle}>
          Hide "Powered by Capturebliss"
        </label>
        <Switch
          checked={config.hidePoweredBy}
          onChange={checked => updateField('hidePoweredBy', checked)}
        />
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>Custom CSS</label>
        <TextArea
          value={config.customCss}
          onChange={e => updateField('customCss', e.target.value)}
          placeholder={`.my-custom-class { color: red; }`}
          rows={4}
          style={{ fontFamily: 'monospace' }}
        />
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          loading={saving}
          onClick={handleSave}
          size="large"
        >
          Save White-Label Settings
        </Button>
      </div>
    </div>
  );
}
