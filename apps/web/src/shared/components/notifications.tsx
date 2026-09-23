'use client';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

type Notice = {
  id: number;
  message: string;
  tone: 'success' | 'error' | 'info';
};
const NotificationContext = createContext<
  { notify(message: string, tone?: Notice['tone']): void } | undefined
>(undefined);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const notify = useCallback(
    (message: string, tone: Notice['tone'] = 'info') => {
      const id = Date.now();
      setNotices((current) => [...current, { id, message, tone }]);
      window.setTimeout(
        () =>
          setNotices((current) => current.filter((notice) => notice.id !== id)),
        5000,
      );
    },
    [],
  );
  const value = useMemo(() => ({ notify }), [notify]);
  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-[100] grid max-w-sm gap-2"
        aria-live="polite"
        aria-atomic="true"
      >
        {notices.map((notice) => (
          <div
            key={notice.id}
            className="rounded-lg border border-border bg-popover px-4 py-3 text-sm text-popover-foreground shadow-md"
            data-tone={notice.tone}
          >
            {notice.message}
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context)
    throw new Error(
      'useNotifications must be used inside NotificationProvider',
    );
  return context;
}
