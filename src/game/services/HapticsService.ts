import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export class HapticsService {
  static impact(style: ImpactStyle = ImpactStyle.Medium): void {
    if (!Capacitor.isNativePlatform()) return;
    void Haptics.impact({ style }).catch(() => undefined);
  }

  static success(): void {
    if (!Capacitor.isNativePlatform()) return;
    void Haptics.notification({ type: NotificationType.Success }).catch(() => undefined);
  }

  static selection(): void {
    if (!Capacitor.isNativePlatform()) return;
    void Haptics.selectionChanged().catch(() => undefined);
  }
}
