export const STATUS_COLORS = {
  pending: {
    bg: 'bg-yellow-500',
    text: 'text-yellow-50',
    border: 'border-yellow-500',
    hover: 'hover:bg-yellow-600'
  },
  approved: {
    bg: 'bg-green-500',
    text: 'text-green-50',
    border: 'border-green-500',
    hover: 'hover:bg-green-600'
  },
  rejected: {
    bg: 'bg-red-500',
    text: 'text-red-50',
    border: 'border-red-500',
    hover: 'hover:bg-red-600'
  },
  played: {
    bg: 'bg-blue-500',
    text: 'text-blue-50',
    border: 'border-blue-500',
    hover: 'hover:bg-blue-600'
  }
} as const;

export const EVENT_STATUS_COLORS = {
  active: STATUS_COLORS.approved,
  ended: STATUS_COLORS.rejected,
  paused: STATUS_COLORS.pending
} as const;

export type RequestStatus = keyof typeof STATUS_COLORS;
export type EventStatus = keyof typeof EVENT_STATUS_COLORS; 