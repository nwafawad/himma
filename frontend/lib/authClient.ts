"use client";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  createdAt?: string;
  avatarUrl?: string | null;
}

const TOKEN_KEY = "momentum_token";
const USER_KEY = "momentum_user";
const AUTH_CHANGE_EVENT = "momentum-auth-change";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

class AuthClient {
  private isBrowser(): boolean {
    return typeof window !== "undefined";
  }

  public getToken(): string | null {
    if (!this.isBrowser()) return null;
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  public getUser(): AuthUser | null {
    if (!this.isBrowser()) return null;
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  public setSession(token: string, user: AuthUser): void {
    if (!this.isBrowser()) return;
    try {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      this.notifyListeners(user);
    } catch (err) {
      console.error("Failed to store auth session:", err);
    }
  }

  public clearSession(): void {
    if (!this.isBrowser()) return;
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      this.notifyListeners(null);
    } catch (err) {
      console.error("Failed to clear auth session:", err);
    }
  }

  private notifyListeners(user: AuthUser | null): void {
    if (!this.isBrowser()) return;
    window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT, { detail: { user } }));
  }

  public onAuthStateChange(listener: (user: AuthUser | null) => void): { unsubscribe: () => void } {
    if (!this.isBrowser()) {
      return { unsubscribe: () => {} };
    }

    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<{ user: AuthUser | null }>;
      listener(customEvent.detail?.user ?? null);
    };

    const storageHandler = (event: StorageEvent) => {
      if (event.key === TOKEN_KEY || event.key === USER_KEY) {
        listener(this.getUser());
      }
    };

    window.addEventListener(AUTH_CHANGE_EVENT, handler);
    window.addEventListener("storage", storageHandler);

    return {
      unsubscribe: () => {
        window.removeEventListener(AUTH_CHANGE_EVENT, handler);
        window.removeEventListener("storage", storageHandler);
      },
    };
  }

  public async signUp(params: { email: string; password: string; name?: string }): Promise<{ token: string; user: AuthUser }> {
    const res = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body.message || "Failed to create account.");
    }

    const { token, user } = body.data;
    this.setSession(token, user);
    return { token, user };
  }

  public async signIn(params: { email: string; password: string }): Promise<{ token: string; user: AuthUser }> {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body.message || "Invalid email or password.");
    }

    const { token, user } = body.data;
    this.setSession(token, user);
    return { token, user };
  }

  public async signOut(): Promise<void> {
    const token = this.getToken();
    if (token) {
      fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }).catch(() => {});
    }
    this.clearSession();
  }

  public async getMe(): Promise<AuthUser | null> {
    const token = this.getToken();
    if (!token) return null;

    try {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          this.clearSession();
        }
        return null;
      }

      const body = await res.json();
      const user = body.data;
      if (user) {
        this.setSession(token, user);
      }
      return user;
    } catch {
      return this.getUser();
    }
  }
}

export const authClient = new AuthClient();
