// ─────────────────────────────────────────────────────────────────
//  Email invitation text — fallback defaults
//  These are used only if the event has no saved email_copy in DB.
//  Edit from the admin panel: Event → Email tab.
// ─────────────────────────────────────────────────────────────────

import type { EmailCopy } from '@/types'

export const EMAIL_COPY: EmailCopy = {
  // Phrase 1 — above event name
  invited_to_en:       'You have been personally invited to',
  invited_to_zh:       '您荣幸地受邀出席',

  // Phrase 2 — above confirm button
  confirm_en:          'Please confirm your attendance to receive your personal invitation with unique QR code.',
  confirm_zh:          '请确认您的出席，以收到您专属的邀请函及二维码。',

  // "DEAR"
  dear_en:             'DEAR',
  dear_zh:             '亲爱的',

  // Confirm button
  confirm_button_en:   'CONFIRM ATTENDANCE →',
  confirm_button_zh:   '确认出席 →',

  // "Or copy this link:"
  copy_link_en:        'Or copy this link:',
  copy_link_zh:        '或复制此链接：',

  // "THANK YOU"
  thank_you_en:        'THANK YOU',
  thank_you_zh:        '谢谢',

  // Footer line 1
  non_transferable_en: 'This invitation is personal and non-transferable.',
  non_transferable_zh: '此邀请函为个人专属，不可转让。',

  // Footer line 2
  present_qr_en:       'Please present your QR code upon arrival at',
  present_qr_zh:       '请在抵达时出示您的二维码：',

  // Email subject
  subject_en:          'Your invitation —',
  subject_zh:          '您的邀请函 —',

  // Header tagline
  personal_invitation_en: 'PERSONAL INVITATION',
  personal_invitation_zh: '个人邀请函',
}

// ─────────────────────────────────────────────────────────────────
//  Event agenda — fallback default (empty)
//  Manage from the admin panel: Event → Email tab.
// ─────────────────────────────────────────────────────────────────

export const EVENT_AGENDA: { time: string; title_en: string; title_zh: string }[] = []
