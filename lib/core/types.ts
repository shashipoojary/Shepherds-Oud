export type ProviderTag = {
  label: string;
  type: "avail" | "wait" | "service" | "lang";
};

export type ProviderMatch = {
  id: string;
  name: string;
  type: string;
  area: string;
  match: number;
  matchId?: string;
  matchStatus?: string;
  availability: string;
  action: string;
  tags: ProviderTag[];
  meta: string[];
  description: string;
  details: Record<string, string>;
  contact: string[];
  availabilityUpdatedAt?: string;
};
