import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";

/** Stable per-device token for one test submission (survives reloads on the same device). */
export function getSubmissionDeviceToken(submissionId: string): string {
  const key = `pyro:test-device:${submissionId}`;
  try {
    const existing = localStorage.getItem(key);
    if (existing && existing.length >= 16) return existing;
    const token = (crypto as any).randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(key, token);
    return token;
  } catch {
    return `${submissionId}-volatile-${Math.random().toString(36).slice(2)}`;
  }
}

/** Human-readable device label, e.g. "Android · Aplicație" or "Windows · Chrome". */
export function describeDevice(ua: string = navigator.userAgent, native = Capacitor.isNativePlatform(), nativePlatform = Capacitor.getPlatform()): string {
  if (native) return `${nativePlatform === "ios" ? "iPhone/iPad" : "Android"} · Aplicație`;
  let os = "Necunoscut";
  if (/iPhone|iPad|iPod/i.test(ua)) os = "iPhone/iPad";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/Windows/i.test(ua)) os = "Windows";
  else if (/CrOS/i.test(ua)) os = "ChromeOS";
  else if (/Mac OS X|Macintosh/i.test(ua)) os = "macOS";
  else if (/Linux/i.test(ua)) os = "Linux";
  let browser = "Browser";
  if (/Edg\//i.test(ua)) browser = "Edge";
  else if (/OPR\//i.test(ua)) browser = "Opera";
  else if (/Firefox\//i.test(ua)) browser = "Firefox";
  else if (/Chrome\//i.test(ua)) browser = "Chrome";
  else if (/Safari\//i.test(ua)) browser = "Safari";
  return `${os} · ${browser}`;
}

export async function claimSubmissionDevice(submissionId: string): Promise<"ok" | "locked"> {
  const { data, error } = await (supabase as any).rpc("claim_submission_device", {
    p_submission_id: submissionId,
    p_token: getSubmissionDeviceToken(submissionId),
    p_label: describeDevice(),
  });
  if (error) throw error;
  return data === "locked" ? "locked" : "ok";
}
