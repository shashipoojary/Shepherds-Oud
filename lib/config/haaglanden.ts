/** Haaglanden municipalities for directory filters and seed defaults. */
export const HAAGLANDEN_MUNICIPALITIES = [
  "Den Haag",
  "Delft",
  "Leidschendam-Voorburg",
  "Rijswijk",
  "Wassenaar",
  "Zoetermeer",
  "Westland",
  "Pijnacker-Nootdorp",
  "Midden-Delfland"
] as const;

export type HaaglandenMunicipality = (typeof HAAGLANDEN_MUNICIPALITIES)[number];

export function isHaaglandenMunicipality(value: string) {
  return (HAAGLANDEN_MUNICIPALITIES as readonly string[]).includes(value);
}
