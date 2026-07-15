import { Routine } from '../types';
import { uid } from '../utils/id';

/** Sensible starter routines so the app is useful on first launch. */
export function seedRoutines(): Routine[] {
  return [
    {
      id: uid(),
      name: 'Morning start',
      emoji: '☀️',
      color: '#E0A458',
      days: [1, 2, 3, 4, 5],
      time: '07:30',
      reminderEnabled: true,
      notificationIds: [],
      steps: [
        { id: uid(), text: 'Drink a glass of water' },
        { id: uid(), text: 'Take meds' },
        { id: uid(), text: 'Make the bed' },
        { id: uid(), text: 'Write today’s top 1 task' },
      ],
    },
    {
      id: uid(),
      name: 'Meds check',
      emoji: '💊',
      color: '#3BA99C',
      days: [0, 1, 2, 3, 4, 5, 6],
      time: '20:00',
      reminderEnabled: true,
      notificationIds: [],
      steps: [{ id: uid(), text: 'Take evening meds' }],
    },
    {
      id: uid(),
      name: 'Wind-down',
      emoji: '🌙',
      color: '#5B4B8A',
      days: [0, 1, 2, 3, 4, 5, 6],
      time: '22:00',
      reminderEnabled: false,
      notificationIds: [],
      steps: [
        { id: uid(), text: 'Phone on charger, out of reach' },
        { id: uid(), text: 'Lay out tomorrow’s clothes' },
        { id: uid(), text: '5 slow breaths' },
      ],
    },
  ];
}
