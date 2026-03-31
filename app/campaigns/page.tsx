import TopBar from '@/components/layout/TopBar';
import CampaignsBoard from '@/components/campaigns/CampaignsBoard';

export default function CampaignsPage() {
  return (
    <div style={{ backgroundColor: 'var(--color-bg-page)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <TopBar />
      <div style={{
        padding: '24px 32px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}>
        <CampaignsBoard />
      </div>
    </div>
  );
}
