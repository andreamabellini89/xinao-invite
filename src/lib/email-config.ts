// ─────────────────────────────────────────────────────────────────
//  Email invitation text — edit here to update all outgoing emails
// ─────────────────────────────────────────────────────────────────

export const EMAIL_COPY = {
  // Shown above the event name (highlighted red in the original design)
  invitedTo: {
    en: 'You have been personally invited to',
    zh: '您荣幸地受邀出席',
  },

  // Shown above the "Confirm Attendance" button (highlighted red in the original design)
  confirmPrompt: {
    en: 'Please confirm your attendance to receive your personal invitation with unique QR code.',
    zh: '请确认您的出席，以收到您专属的邀请函及二维码。',
  },
}

// ─────────────────────────────────────────────────────────────────
//  Event agenda — add / remove / reorder items freely
//  Each item: { time: string, title_en: string, title_zh: string }
// ─────────────────────────────────────────────────────────────────

export const EVENT_AGENDA: { time: string; title_en: string; title_zh: string }[] = [
  // { time: '19:00', title_en: 'Arrival & Welcome Drinks', title_zh: '抵达及欢迎饮品' },
  // { time: '19:30', title_en: 'Opening Remarks',          title_zh: '开幕致辞' },
  // { time: '20:00', title_en: 'Dinner',                   title_zh: '晚宴' },
  // { time: '21:30', title_en: 'Anniversary Celebration',  title_zh: '周年庆典' },
]
// ↑ Remove the // at the start of each line to activate an item,
//   or add new lines following the same format.
