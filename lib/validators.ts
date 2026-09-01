import { z } from 'zod';
export const registerSchema = z.object({ email: z.string().email(), password: z.string().min(8), name: z.string().min(2) });
export const loginSchema = z.object({ email: z.string().email(), password: z.string() });
export const createProjectSchema = z.object({
  title: z.string().min(1), description: z.string().optional(),
  style: z.enum(["VIRAL","EDUCATIONAL","PODCAST","GAMING","MOTIVATIONAL","STORYTELLING","NEWS","COMEDY"]).default("VIRAL"),
  aspectRatio: z.enum(["AR_9_16","AR_16_9","AR_1_1"]).default("AR_9_16"),
  platform: z.enum(["TIKTOK","YOUTUBE_SHORTS","INSTAGRAM_REELS","FACEBOOK_REELS"]).default("TIKTOK"),
  clipCount: z.number().min(1).max(20).default(5),
  clipDuration: z.number().min(5).max(180).default(30),
  aiIntensity: z.string().default("balanced")
});
export const generateClipsSchema = z.object({
  clipCount: z.number().min(1).max(20), clipDuration: z.number().min(5).max(180),
  aspectRatio: z.enum(["AR_9_16","AR_16_9","AR_1_1"]), style: z.string(), aiIntensity: z.string()
});
