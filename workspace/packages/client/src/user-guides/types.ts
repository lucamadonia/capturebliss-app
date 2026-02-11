import { TourStepProps } from 'antd';

export const USER_GUIDE_LOCAL_STORE_KEY = 'capturebliss/user_guide';

export enum UserGuideMsg {
  OPEN_ANNOTATION = 'capturebliss-guide-open-annotation',
  RESET_ZOOM = 'capturebliss-guide-reset-zoom',
  RESET_KEY = 'capturebliss-guide-reset-key'
}

export type UserGuideCustomPosition = 'bottom-left';

export interface TourStepPropsWithElHotspotConfig extends TourStepProps {
  hotspot?: boolean;
  hideNavButtons?: boolean;
  hotspotTarget?: () => Element;
  width?: string;
  customPosition?: UserGuideCustomPosition;
}

export interface Guide {
  id: string;
  name: string;
  desc: { toursCreated: string; toursNotCreated: string; };
  steps: TourStepPropsWithElHotspotConfig[];
  serialId: number;
}

export interface GuideProps {
  goToNextUserGuide: () => void;
  isVisible: boolean;
}

export interface GuideInfo {
  stepsTaken: number;
  totalSteps: number;
  isCompleted: boolean;
  isSkipped: boolean;
  name: string;
  id: string;
  groupId: string;
  desc: { toursCreated: string; toursNotCreated: string; };
  partId: number;
  serialId: number;
}
