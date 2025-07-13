export interface MediaFile {
  file: File;
  name: string;
}

export type Operation = 'convert' | 'trim' | '';

export type ConvertFormat = 'mp3' | 'wav' | 'm4a' | 'aac' | 'flac' | 'ogg' | 'opus' | 'mp4' | 'mkv' | 'mov' | 'avi' | 'webm';

export interface ConvertOptions {
  format: ConvertFormat;
}

export interface TrimOptions {
  startTime: string;
  endTime: string;
}

export interface ProcessingOptions {
  inputFileName: string;
  operation: Operation;
  convertOptions?: ConvertOptions;
  trimOptions?: TrimOptions;
}

export interface OutputMessage {
  text: string;
  type: 'success' | 'error' | 'info' | '';
}

export interface MediaProcessorState {
  selectedFile: File | null;
  fileName: string;
  operation: Operation;
  convertFormat: ConvertFormat;
  trimStart: string;
  trimEnd: string;
  isProcessing: boolean;
  outputMessage: OutputMessage;
}