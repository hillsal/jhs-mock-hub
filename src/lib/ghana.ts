export const GHANA_REGIONS = [
  "Ahafo",
  "Ashanti",
  "Bono",
  "Bono East",
  "Central",
  "Eastern",
  "Greater Accra",
  "North East",
  "Northern",
  "Oti",
  "Savannah",
  "Upper East",
  "Upper West",
  "Volta",
  "Western",
  "Western North",
] as const;

export const SCHOOL_TYPES = [
  "Public JHS",
  "Private JHS",
  "Mission / Faith-based JHS",
  "International JHS",
] as const;

export const CANDIDATE_OPTIONS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 150, 200] as const;

export function formatGhs(amount: number) {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    minimumFractionDigits: 2,
  }).format(amount);
}
