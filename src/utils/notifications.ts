import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Routine } from '../types';

// Local notifications aren't supported on web; skip handler setup there.
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/** Ask for permission once; returns true if we can post notifications. */
export async function ensurePermissions(): Promise<boolean> {
  const settings = await Notifications.getPermissionsAsync();
  let granted =
    settings.granted ||
    settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
  if (!granted) {
    const req = await Notifications.requestPermissionsAsync();
    granted = req.granted;
  }
  if (granted && Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('routines', {
      name: 'Routine reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }
  return granted;
}

/**
 * Cancel any existing reminders for a routine and, if enabled, schedule one
 * weekly notification per repeat day at the routine's time. Returns the new
 * notification ids to persist on the routine.
 */
export async function rescheduleRoutine(routine: Routine): Promise<string[]> {
  // Web can't schedule local notifications — no-op so seeding never fails there.
  if (Platform.OS === 'web') return [];

  // Clear old ones first.
  await cancelRoutine(routine);

  if (!routine.reminderEnabled || !routine.time || routine.days.length === 0) {
    return [];
  }

  const granted = await ensurePermissions();
  if (!granted) return [];

  const [hStr, mStr] = routine.time.split(':');
  const hour = parseInt(hStr, 10);
  const minute = parseInt(mStr, 10);

  const ids: string[] = [];
  for (const day of routine.days) {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `${routine.emoji} ${routine.name}`,
        body:
          routine.steps.length > 0
            ? `Time to start — ${routine.steps.length} step${
                routine.steps.length === 1 ? '' : 's'
              } to go.`
            : 'Time to start.',
        ...(Platform.OS === 'android' ? { channelId: 'routines' } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        // expo-notifications weekday is 1=Sun … 7=Sat
        weekday: day + 1,
        hour,
        minute,
      },
    });
    ids.push(id);
  }
  return ids;
}

export async function cancelRoutine(routine: Routine): Promise<void> {
  for (const id of routine.notificationIds) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch {
      // Already gone — ignore.
    }
  }
}
