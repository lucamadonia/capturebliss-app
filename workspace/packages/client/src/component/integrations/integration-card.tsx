import React, { useState } from 'react';
import { PlatformIntegrationType, RespLinkedApps, RespPlatformIntegration } from '@capturebliss/common/dist/api-contract';
import * as Tags from './styled';
import UpgradeIcon from '../upgrade/icon';
import UpgradeModal from '../upgrade/upgrade-modal';
import { P_RespSubscription } from '../../entity-processor';
import { amplitudeUpgradeModalOpen } from '../../amplitude';

interface Props {
  appConfig: RespLinkedApps | RespPlatformIntegration;
  onClick: () => void;
  disable: boolean;
  subs: P_RespSubscription | null;
}

const Desc = {
  pipedrive: (
    <>
      <p>
        Capturebliss's integration with Pipedrive CRM helps you by:
      </p>
      <ul>
        <li>Adds or updates <em>lead</em> information in Pipedrive whenever a lead form is filled up</li>
        <li>Adds or updates <em>lead</em> information in Pipedrive whenever lead information is passed to Capturebliss</li>
      </ul>
      <p>You can then proceed to send your nurture drip campaigns to engage your leads and convert them to customers</p>
    </>
  ),
  slack: (
    <>
      <p>
        Capturebliss's integration with slack allows you to get real-time messages when:
      </p>
      <ul>
        <li>A lead form is filled up in the demo</li>
        <li>A lead information is passed to Capturebliss</li>
      </ul>
      <p>In an event that the same person views the demo again, you'll receive another alert on the slack channel.</p>
      <p>This integration unfurls the demo link with CTA whenever your viewers share the demo link in a slack channel</p>
    </>
  ),
  salesforce: (
    <>
      <p>
        Capturebliss's integration with Salesforce helps you by:
      </p>
      <ul>
        <li>When a lead submits a form</li>
        <li>When a lead information is passed to Capturebliss</li>
      </ul>
      <p>You can then proceed to send your nurture drip campaigns to engage your leads and convert them to customers.</p>
    </>
  ),
  mailchimp: (
    <>
      <p>
        Capturebliss's integration with MailChimp helps you by:
      </p>
      <ul>
        <li>Adding / updating contact  in your audience list when a lead submits a form</li>
        <li>Adding / updating contact  in your audience list when lead information is passed to Capturebliss</li>
      </ul>
      <p>You can then proceed to send your nurture drip campaigns to engage your leads and convert them to customers.</p>
    </>
  ),
  hubspot: (
    <>
      <p>
        Capturebliss seamlessly integrates with various modules of HubSpot.
        Capturebliss supports the following operations:
      </p>
      <ul>
        <li>Syncs <em>contact</em> information with HubSpot</li>
        <li>
          Makes entries in the <em>contact activity timeline</em> about:
          <ul>
            <li>CTA clicks of each demo</li>
            <li>Aggregated metrics of all demos</li>
          </ul>
        </li>
        <li>Adds <em>custom contact properties</em> for reporting and analytics of demos</li>
        <li>Adds contact group called <em>Capturebliss Demo</em> to show a detailed overview of all actions performed by the contact</li>
        <li>Creates a drill-down called Capturebliss drill-down which shows the top demos engaged by the contact</li>
      </ul>
    </>
  ),
  [PlatformIntegrationType.CaptureblissWebhook]: (
    <>
      <p>
        Capturebliss helps you configure your webhooks here to receive data as and when an event happens in a demo.
        Capturebliss sends the following event data to a webhook:
      </p>
      <ul>
        <li>When a lead submits a form</li>
        <li>When a lead information is passed to Capturebliss</li>
      </ul>
      <p>
        If you need any other custom event data posted to your webhook, please contact us via our in-app chat or write to us at&nbsp;
        <a
          href="mailto:support@capturebliss.com?subject=Custom requirement for webhook"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          support@capturebliss.com
        </a>
      </p>
    </>
  ),
  [PlatformIntegrationType.Zapier]: (
    <>
      <p>
        Capturebliss's integration with Zapier lets you trigger a zap (zapier workflow) whenever a following event occurs:
      </p>
      <ul>
        <li>When a lead submits a form</li>
        <li>When a lead information is passed to Capturebliss</li>
      </ul>
      <p>
        If you need any other custom event data posted to Zapier, please contact us via our in-app chat or write to us at&nbsp;
        <a
          href="mailto:support@capturebliss.com?subject=Add event for zapier"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          support@capturebliss.com
        </a>
      </p>
    </>
  )
};

export default function IntegrationCard(props: Props): JSX.Element {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  return (
    <Tags.Con onClick={props.onClick}>
      <img src={props.appConfig.icon} alt="" height={24} />
      <div
        style={{ flex: '1 0 auto', width: 'calc(100% - 1rem - 24px - 1rem)' }}
        onClick={props.disable ? (e) => {
          e.stopPropagation();
          e.preventDefault();
          setShowUpgradeModal(true);
          amplitudeUpgradeModalOpen('integrations');
        } : undefined}
      >
        <Tags.L1>
          <div className="header">
            {props.appConfig.name} &nbsp;
            {props.disable && <UpgradeIcon />}
          </div>
          <div className="mini">
            {/* TODO  the following force casting to any is done because RespPlatformIntegration does not have content property */}
            {(props.appConfig as any).connected && (
              <>
                <span style={{ color: '#4CAF50', fontSize: '1rem' }}>●</span>&nbsp;
                <span>Connected</span>
              </>
            )}
          </div>
        </Tags.L1>
        <Tags.L2>
          {(Desc as any)[props.appConfig.type]}
        </Tags.L2>
      </div>
      <UpgradeModal
        showUpgradePlanModal={showUpgradeModal}
        setShowUpgradePlanModal={setShowUpgradeModal}
        subs={props.subs}
      />
    </Tags.Con>
  );
}
