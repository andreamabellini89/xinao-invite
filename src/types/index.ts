export type EventStatus = 'upcoming' | 'active' | 'past'
export type GuestStatus = 'invited' | 'registered' | 'checked-in'

export interface EmailCopy {
  // Phrase 1 — above event name
  invited_to_en:       string
  invited_to_zh:       string
  // Phrase 2 — above confirm button
  confirm_en:          string
  confirm_zh:          string
  // "DEAR"
  dear_en:             string
  dear_zh:             string
  // Confirm button
  confirm_button_en:   string
  confirm_button_zh:   string
  // "Or copy this link:"
  copy_link_en:        string
  copy_link_zh:        string
  // "THANK YOU"
  thank_you_en:        string
  thank_you_zh:        string
  // Footer line 1
  non_transferable_en: string
  non_transferable_zh: string
  // Footer line 2
  present_qr_en:       string
  present_qr_zh:       string
  // Email subject
  subject_en:          string
  subject_zh:          string
  // Header tagline
  personal_invitation_en: string
  personal_invitation_zh: string
}

export interface AgendaItem {
  time:     string
  title_en: string
  title_zh: string
}

export interface XinaoEvent {
  id: string
  name: string
  subtitle: string | null
  date: string
  time: string
  location: string
  address: string | null
  description: string | null
  status: EventStatus
  cover_image_url: string | null
  event_number: string | null
  email_copy: EmailCopy | null
  agenda: AgendaItem[] | null
  created_at: string
  updated_at: string
}

export interface Guest {
  id: string
  event_id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  company: string | null
  guest_token: string
  qr_token: string
  status: GuestStatus
  registered_at: string | null
  checked_in_at: string | null
  created_at: string
  updated_at: string
}

export interface EventStats {
  total: number
  registered: number
  checked_in: number
  invited: number
}

export interface ScheduleItem {
  time: string
  activity: string
}

export interface EventFormData {
  name: string
  subtitle: string
  date: string
  time: string
  location: string
  address: string
  description: string
  status: EventStatus
  cover_image_url: string | null
  event_number: string
  schedule: ScheduleItem[]
}
