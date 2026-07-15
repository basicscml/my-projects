# FocusFlow

A calm, ADHD-friendly **routines & reminders** app for iOS and Android. Built with React Native + Expo.

FocusFlow helps you get through recurring routines (morning start, meds, wind-down) without the overwhelm — one small step at a time, with gentle daily reminders.

## Why it's built for ADHD

- **One step at a time.** The runner shows a single "Do this now" step with a big button, instead of a wall-of-text checklist that's easy to freeze on.
- **Visible progress.** Progress rings on every routine turn "I did some of it" into a clear, rewarding signal.
- **Low stimulation.** Soft palette, few colors, one primary action per screen. Light and dark mode.
- **Gentle reminders.** A daily local notification at the time you choose, only on the days a routine runs.
- **No accounts, no setup.** Everything is stored on-device and works offline.

## Features

- **Today** — the routines scheduled for today, each with a progress ring; tap to run one.
- **Runner** — step-by-step flow with a focused "current step" card and an optional full checklist.
- **Routines** — create/edit routines: name, emoji, color, repeat days, reminder time, and steps.
- **Reminders** — one local notification per repeat day at the routine's time (toggle per routine).
- Comes with three starter routines on first launch.

## Running it

```bash
npm install
npx expo start
```

Then:

- Press `i` for the iOS simulator, `a` for an Android emulator, or
- Scan the QR code with the **Expo Go** app on your phone.

> Local notifications work in Expo Go on iOS/Android. For the most reliable
> scheduled reminders (and to ship to the stores), build a dev/production
> client with EAS: `npx eas build`.

## Project layout

```
App.tsx                     App entry: providers + navigation
index.ts                    Expo root registration
src/
  types.ts                  Routine / Step / Completions models
  theme.ts                  Light + dark palette, useTheme()
  store/
    RoutinesContext.tsx     Central state + persistence + scheduling
    storage.ts              AsyncStorage read/write
    seed.ts                 Starter routines
  utils/
    dates.ts                Weekday / date-key / formatting helpers
    notifications.ts        expo-notifications scheduling
    id.ts                   Local id generation
  navigation/               Tabs + stack
  components/               ProgressRing, DayPicker, TimePicker
  screens/                  Today, Routines, RoutineEditor, RoutineRunner
```

## Data & privacy

All data lives on the device via `AsyncStorage`. Nothing is sent anywhere.
Cloud sync and accounts can be added later without changing the UI.

## Roadmap ideas

- Streaks / habit history
- Focus timer (Pomodoro) inside the runner
- Reorder steps by drag
- Cloud sync across devices
