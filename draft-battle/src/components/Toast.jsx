// Toast — lightweight in-app notification that replaces browser alert().
// Usage: import { useToast } from './Toast'
//        const toast = useToast();
//        toast('Something went wrong');
import { useState, useCallback, createContext, useContext } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [messages, setMessages] = useState([]);

  const toast = useCallback((msg) => {
    const id = Date.now();
    setMessages(prev => [...prev, { id, msg }]);
    setTimeout(() => setMessages(prev => prev.filter(m => m.id !== id)), 3000);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div style={{
        position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center',
        zIndex: 9999, pointerEvents: 'none',
      }}>
        {messages.map(({ id, msg }) => (
          <div key={id} style={{
            background: 'var(--panel)',
            border: '1.5px solid var(--carolina)',
            borderRadius: '10px',
            padding: '12px 24px',
            color: 'var(--text)',
            fontWeight: 700,
            fontSize: '0.95rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            animation: 'fadeIn 0.2s ease',
          }}>
            {msg}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
