const SESSION_KEY = "customerHubSession";

export interface Session {
  mobile: string;
  isAdmin: boolean;
  userName: string;
  loggedInAt: number;
}

export function useAuth(): {
  session: Session | null;
  login: (mobile: string, isAdmin: boolean, userName: string) => void;
  logout: () => void;
} {
  const raw = localStorage.getItem(SESSION_KEY);
  let session: Session | null = null;
  if (raw) {
    try {
      session = JSON.parse(raw) as Session;
    } catch {
      session = null;
    }
  }

  const login = (mobile: string, isAdmin: boolean, userName: string) => {
    const newSession: Session = {
      mobile,
      isAdmin,
      userName,
      loggedInAt: Date.now(),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
    window.location.reload();
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    window.location.reload();
  };

  return { session, login, logout };
}
