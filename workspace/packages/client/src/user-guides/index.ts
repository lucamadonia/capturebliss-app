import TourCardGuide from './tour-card-guide';
import ShareEmbedDemoGuide from './share-embed-demo-guide';
import ExploringCanvasGuide from './exploring-canvas-guide';
import EditingInteractiveDemoGuidePart1 from './editing-interactive-demo-guide/part-1';
import EditingInteractiveDemoGuidePart2 from './editing-interactive-demo-guide/part-2';
import { insertCaptureblissUserGuide, removeDeprecatedTours, upsertCaptureblissUserGuide } from './utils';

const allUserGuides = [
  TourCardGuide,
  ShareEmbedDemoGuide,
  ExploringCanvasGuide,
  EditingInteractiveDemoGuidePart1,
  EditingInteractiveDemoGuidePart2
];

export const removeOldGuides = (): void => removeDeprecatedTours(allUserGuides);

export const insertAllUserGuides = (): void => insertCaptureblissUserGuide(allUserGuides);

export const upsertAllUserGuides = (): void => {
  allUserGuides.forEach(guide => upsertCaptureblissUserGuide(guide.guideInfo));
};
