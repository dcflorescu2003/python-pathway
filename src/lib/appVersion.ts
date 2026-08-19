/**
 * Versiunea aplicației trimisă serverului la acordarea progresului.
 * Serverul refuză acordarea de XP pentru build-uri mai vechi decât versiunea
 * minimă (clienți vechi retrimit istoric local și umflau XP-ul).
 * Se sincronizează manual cu android/app/build.gradle și MARKETING_VERSION (iOS).
 */
export const APP_VERSION = "1.117";
