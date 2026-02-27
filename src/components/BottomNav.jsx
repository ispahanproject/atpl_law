import { s } from '../styles/theme.js';

const tabs = [
  { id: 'articles', icon: '📖', label: '法令' },
  { id: 'regulations', icon: '📋', label: '規定' },
  { id: 'links', icon: '🔗', label: '関係' },
];

export default function BottomNav({ activeTab, onTabChange }) {
  return (
    <nav style={s.bottomNav}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          style={s.navItem(activeTab === tab.id)}
        >
          <span style={{ fontSize: 20 }}>{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
