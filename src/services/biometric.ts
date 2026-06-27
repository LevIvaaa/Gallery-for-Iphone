import { registerPlugin, Capacitor } from "@capacitor/core";

interface BiometricPlugin {
  verify(options: { reason: string }): Promise<{ success: boolean }>;
}

const Biometric = registerPlugin<BiometricPlugin>("Biometric");

/**
 * Проверка по Face ID / Touch ID / код-паролю (для скрытых фото).
 * На вебе биометрии нет — возвращаем true (превью).
 */
export async function verifyBiometric(
  reason = "Доступ к скрытым фото"
): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return true;
  try {
    const res = await Biometric.verify({ reason });
    return !!res.success;
  } catch {
    return false;
  }
}
