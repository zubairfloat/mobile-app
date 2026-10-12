export type Address = {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  state: string | null;
  postal_code: string;
  country: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};
export const addressFields = [
  ["full_name", "Full name", true],
  ["phone", "Phone", true],
  ["address_line_1", "Address line 1", true],
  ["address_line_2", "Address line 2", false],
  ["city", "City", true],
  ["state", "State / Province", false],
  ["postal_code", "Postal code", true],
  ["country", "Country", true],
] as const;
