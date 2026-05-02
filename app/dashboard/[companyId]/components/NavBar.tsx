'use client';

type Tab = 'schedule' | 'create' | 'forums' | 'product' | 'analytics' | 'history';

interface NavBarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'schedule',  label: 'Schedule'  },
  { id: 'create',    label: 'Create'    },
  { id: 'forums',    label: 'Forums'    },
  { id: 'product',   label: 'Product'   },
  { id: 'analytics', label: 'Analytics' },
  { id: 'history',   label: 'History'   },
];

export default function NavBar({ activeTab, setActiveTab }: NavBarProps) {
  return (
    <div
      style={{
        background: '#111111',
        borderBottom: '1px solid #222222',
        display: 'flex',
        gap: 0,
        padding: '0 24px',
        overflowX: 'auto',
      }}
    >
      {TABS.map((tab) => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: active ? '2px solid #FF5C1A' : '2px solid transparent',
              color: active ? '#FF5C1A' : '#555555',
              fontSize: 13,
              fontWeight: 600,
              padding: '14px 18px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'color 0.15s',
              letterSpacing: 0.2,
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export type { Tab };
