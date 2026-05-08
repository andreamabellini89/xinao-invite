import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ── Events ────────────────────────────────────────────────────────────────────
export async function getEvents() {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getEvent(id: string) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createEvent(event: Omit<import('@/types').XinaoEvent, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('events')
    .insert(event)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateEvent(id: string, updates: Partial<import('@/types').XinaoEvent>) {
  const { data, error } = await supabase
    .from('events')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteEvent(id: string) {
  const { error } = await supabase.from('events').delete().eq('id', id)
  if (error) throw error
}

// ── Guests ────────────────────────────────────────────────────────────────────
export async function getGuests(eventId: string) {
  const { data, error } = await supabase
    .from('guests')
    .select('*')
    .eq('event_id', eventId)
    .order('last_name', { ascending: true })
  if (error) throw error
  return data
}

export async function getGuestByToken(guestToken: string, eventId: string) {
  const { data, error } = await supabase
    .from('guests')
    .select('*')
    .eq('guest_token', guestToken)
    .eq('event_id', eventId)
    .single()
  if (error) return null
  return data
}

export async function getGuestByQR(qrToken: string, eventId: string) {
  const { data, error } = await supabase
    .from('guests')
    .select('*')
    .eq('qr_token', qrToken)
    .eq('event_id', eventId)
    .single()
  if (error) return null
  return data
}

export async function registerGuest(
  guestToken: string,
  eventId: string,
  info: { first_name: string; last_name: string; email: string; phone?: string }
) {
  const { data, error } = await supabase
    .from('guests')
    .update({
      ...info,
      status: 'registered',
      registered_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('guest_token', guestToken)
    .eq('event_id', eventId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function checkInGuest(qrToken: string, eventId: string) {
  const guest = await getGuestByQR(qrToken, eventId)
  if (!guest) return { success: false, reason: 'invalid' as const }
  if (guest.status === 'checked-in') return { success: false, reason: 'already' as const, guest }

  const { data, error } = await supabase
    .from('guests')
    .update({
      status: 'checked-in',
      checked_in_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', guest.id)
    .select()
    .single()
  if (error) throw error
  return { success: true, reason: 'success' as const, guest: data }
}

export async function importGuestsCSV(
  eventId: string,
  rows: Array<{ first_name: string; last_name: string; email?: string; phone?: string }>
) {
  const { v4: uuidv4 } = await import('uuid')
  const guests = rows.map((r) => ({
    event_id: eventId,
    first_name: r.first_name,
    last_name: r.last_name,
    email: r.email || null,
    phone: r.phone || null,
    guest_token: uuidv4(),
    qr_token: uuidv4(),
    status: 'invited' as const,
  }))

  const { data, error } = await supabase
    .from('guests')
    .upsert(guests, { onConflict: 'event_id,email', ignoreDuplicates: true })
    .select()
  if (error) throw error
  return data
}

// ── Storage ───────────────────────────────────────────────────────────────────
export async function uploadEventImage(file: File, eventId: string): Promise<string> {
  const ext = file.name.split('.').pop()
  const path = `events/${eventId}/cover.${ext}`

  const { error } = await supabase.storage
    .from('event-images')
    .upload(path, file, { upsert: true })
  if (error) throw error

  const { data } = supabase.storage.from('event-images').getPublicUrl(path)
  return data.publicUrl
}
