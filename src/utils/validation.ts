import { OutputMessage } from '../types';

export const validateTimes = (
  trimStart: string,
  trimEnd: string
): { isValid: boolean; message?: OutputMessage } => {
  // Basic regex for HH:MM:SS.mmm or HH:MM:SS
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])(\.\d{1,3})?$/;
  
  if (!timeRegex.test(trimStart)) {
    return {
      isValid: false,
      message: {
        text: "Invalid start time format. Use HH:MM:SS or HH:MM:SS.mmm",
        type: "error",
      }
    };
  }
  
  if (!timeRegex.test(trimEnd)) {
    return {
      isValid: false,
      message: {
        text: "Invalid end time format. Use HH:MM:SS or HH:MM:SS.mmm",
        type: "error",
      }
    };
  }
  
  // Further validation could convert to seconds and compare, e.g. start < end
  // This is a simplified check for now.
  if (trimStart >= trimEnd) {
    return {
      isValid: false,
      message: {
        text: "Error: Trim start time must be before end time.",
        type: "error",
      }
    };
  }
  
  return { isValid: true };
};

export const generateOutputFileName = (
  fileName: string,
  operation: string,
  convertFormat?: string
): string => {
  const nameWithoutExtension = fileName.substring(0, fileName.lastIndexOf(".")) || fileName;
  
  if (operation === "convert" && convertFormat) {
    return `${nameWithoutExtension}_converted.${convertFormat}`;
  } else if (operation === "trim") {
    // Try to keep original extension for trim if it's a video format, or use a common one.
    const originalExtension = (
      fileName.lastIndexOf(".") > -1
        ? fileName.substring(fileName.lastIndexOf(".") + 1)
        : "mp4"
    ).toLowerCase();
    
    const videoExtensions = ["mp4", "mkv", "mov", "avi", "webm"];
    const audioExtensions = ["mp3", "wav", "m4a", "aac", "flac", "ogg", "opus"];
    
    let outputExtension = originalExtension;
    if (videoExtensions.includes(originalExtension)) {
      outputExtension = originalExtension; // Keep original video extension
    } else if (audioExtensions.includes(originalExtension)) {
      outputExtension = originalExtension; // Keep original audio extension
    } else {
      // Fallback if extension is unknown or not typically trimmable directly
      outputExtension = "mp4";
    }
    
    return `${nameWithoutExtension}_trimmed.${outputExtension}`;
  }
  
  return fileName;
};

export const getMessageColor = (type: string): string => {
  switch (type) {
    case "success":
      return "text-green-600 dark:text-green-400";
    case "error":
      return "text-red-600 dark:text-red-400";
    case "info":
      return "text-blue-600 dark:text-blue-400";
    default:
      return "text-gray-700 dark:text-gray-300";
  }
};