// Smart Crop Abstraction - face/speaker detection
// For production, plug OpenCV, MediaPipe, or cloud vision here

export interface CropRegion {
  x: number; // 0-1 normalized
  y: number;
  width: number;
  height: number;
  confidence: number;
  type: 'face' | 'person' | 'speaker' | 'center';
}

export interface SmartCropOptions {
  mode: 'center' | 'face' | 'speaker' | 'smart';
  targetWidth: number;
  targetHeight: number;
  sourceWidth: number;
  sourceHeight: number;
}

export interface SmartCropResult {
  cropFilter: string; // ffmpeg crop filter
  regions: CropRegion[];
}

export class SmartCropService {
  // Mock implementation - returns center crop
  // Replace with real face detection: use face-api.js, MediaPipe, or call Python service
  async detectRegions(videoPath: string, atSecond: number): Promise<CropRegion[]> {
    // TODO: integrate face detection
    // For now return center region
    return [{ x: 0.5, y: 0.5, width: 0.6, height: 0.8, confidence: 0.9, type: 'center' }];
  }

  async getCropFilter(opts: SmartCropOptions, regions?: CropRegion[]): Promise<SmartCropResult> {
    const { mode, targetWidth, targetHeight, sourceWidth, sourceHeight } = opts;

    if (mode === 'center') {
      // Scale to fill then crop center
      return {
        cropFilter: `scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=increase,crop=${targetWidth}:${targetHeight}`,
        regions: [{ x: 0.5, y: 0.5, width: 1, height: 1, confidence: 1, type: 'center' }]
      };
    }

    if (mode === 'smart' || mode === 'face' || mode === 'speaker') {
      // If we have face region, crop around it
      const face = regions?.find(r => r.type === 'face' || r.type === 'speaker') || regions?.[0];
      if (face && sourceWidth > 0) {
        // Convert normalized to pixel, then calculate crop that keeps face in upper third for 9:16
        // For 9:16, we want face at y ~ 0.35
        const faceCenterX = face.x; // 0-1
        const faceCenterY = face.y;

        // Calculate crop position to keep face centered horizontally and at 35% vertical
        // FFmpeg expression: crop with dynamic x,y based on face detection
        // For mock, we still use center but structure ready for real coords

        // Example real filter with face coords:
        // crop=1080:1920:(in_w-1080)*faceX:(in_h-1920)*0.35
        const xExpr = `(in_w-${targetWidth})*${faceCenterX.toFixed(3)}`;
        const yExpr = `(in_h-${targetHeight})*${Math.min(0.35, faceCenterY).toFixed(3)}`;

        return {
          cropFilter: `scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=increase,crop=${targetWidth}:${targetHeight}:${xExpr}:${yExpr}`,
          regions: [face]
        };
      }

      return {
        cropFilter: `scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=increase,crop=${targetWidth}:${targetHeight}`,
        regions: regions || []
      };
    }

    return {
      cropFilter: `scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=increase,crop=${targetWidth}:${targetHeight}`,
      regions: []
    };
  }
}

export const smartCropService = new SmartCropService();
