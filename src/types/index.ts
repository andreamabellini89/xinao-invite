export type EventStatus = 'upcoming' | 'active' | 'past'
export type GuestStatus = 'invited' | 'registered' | 'checked-in'

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
}
