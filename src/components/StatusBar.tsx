// Имитация статус-бара iOS (время, сеть, Wi-Fi, батарея).
export function StatusBar() {
  return (
    <div className="status-bar">
      <span className="status-time">9:41</span>
      <div className="status-island" aria-hidden />
      <div className="status-right">
        <SignalIcon />
        <WifiIcon />
        <BatteryIcon />
      </div>
    </div>
  );
}

const SignalIcon = () => (
  <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor">
    <rect x="0" y="8" width="3" height="4" rx="1" />
    <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
    <rect x="10" y="3" width="3" height="9" rx="1" />
    <rect x="15" y="0.5" width="3" height="11.5" rx="1" />
  </svg>
);

const WifiIcon = () => (
  <svg width="17" height="12" viewBox="0 0 17 12" fill="currentColor">
    <path d="M8.5 2C5.4 2 2.6 3.2.6 5.2l1.4 1.5C3.7 5 6 4 8.5 4s4.8 1 6.5 2.7l1.4-1.5C14.4 3.2 11.6 2 8.5 2z" />
    <path d="M8.5 6c-1.7 0-3.3.7-4.5 1.8L8.5 12 13 7.8C11.8 6.7 10.2 6 8.5 6z" />
  </svg>
);

const BatteryIcon = () => (
  <svg width="27" height="13" viewBox="0 0 27 13" fill="none">
    <rect x="0.5" y="0.5" width="22" height="12" rx="3.5" stroke="currentColor" opacity="0.4" />
    <rect x="2" y="2" width="18" height="9" rx="2" fill="currentColor" />
    <path d="M24 4v5c1.1-.4 1.8-1.4 1.8-2.5S25.1 4.4 24 4z" fill="currentColor" opacity="0.5" />
  </svg>
);
