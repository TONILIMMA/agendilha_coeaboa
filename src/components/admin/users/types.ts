export type UserStatus = "master" | "admin" | "collaborator" | "user" | "artist";
export type UserCategory = "usuario" | "promotor" | "divulgador" | "estabelecimento";

export interface UserWithRole {
  id: string;
  email: string;
  created_at: string;
  is_admin: boolean;
  is_master?: boolean;
  status?: UserStatus;
  user_type?: string;
  company_type?: string | null;
  responsible_name: string | null;
  phone: string | null;
  address_neighborhood?: string | null;
  musical_preferences?: string[] | null;
}

export interface ResetResultState {
  user: UserWithRole;
  tempPassword: string;
  whatsappUrl: string | null;
  phone: string | null;
  phoneIsValid: boolean;
  recipientName: string | null;
  customNote: string;
  message: string;
}