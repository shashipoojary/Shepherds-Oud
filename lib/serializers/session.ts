export type SafeSession = {
  expiresAt: Date | string;
};

type SessionLike = {
  expiresAt: Date | string;
};

export function toSafeSession(session: SessionLike): SafeSession {
  return {
    expiresAt: session.expiresAt
  };
}
