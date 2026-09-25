import * as Notifications from "expo-notifications";
import { Admission } from "../types/models";

const REMINDER_PREFIX = "class-reminder-";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function reminderTime(dayOfWeek: number, startTime: string) {
  const [hour, minute] = startTime.split(":").map(Number);
  let reminderMinutes = hour * 60 + minute - 10;
  let reminderDay = dayOfWeek;
  if (reminderMinutes < 0) {
    reminderMinutes += 24 * 60;
    reminderDay = dayOfWeek === 1 ? 7 : dayOfWeek - 1;
  }
  const expoWeekday = reminderDay === 7 ? 1 : reminderDay + 1;
  return { weekday: expoWeekday, hour: Math.floor(reminderMinutes / 60), minute: reminderMinutes % 60 };
}

export async function scheduleClassReminders(admission: Admission | null): Promise<void> {
  const existing = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    existing
      .filter((notification) => notification.identifier.startsWith(REMINDER_PREFIX))
      .map((notification) => Notifications.cancelScheduledNotificationAsync(notification.identifier))
  );

  if (!admission?.subjects?.length) return;

  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) {
    const requested = await Notifications.requestPermissionsAsync();
    if (!requested.granted) return;
  }

  await Notifications.setNotificationChannelAsync("class-reminders", {
    name: "Class reminders",
    importance: Notifications.AndroidImportance.HIGH,
    sound: "default",
  });

  await Promise.all(
    admission.subjects.map(async ({ subject }) => {
      const time = reminderTime(subject.dayOfWeek, subject.startTime);
      await Notifications.scheduleNotificationAsync({
        identifier: `${REMINDER_PREFIX}${subject.id}`,
        content: {
          title: "Class starting soon",
          body: `${subject.code} - ${subject.title} starts in 10 minutes at ${subject.startTime}.`,
          sound: "default",
          data: { subjectId: subject.id },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: time.weekday, hour: time.hour, minute: time.minute, channelId: "class-reminders" },
      });
    })
  );
}
