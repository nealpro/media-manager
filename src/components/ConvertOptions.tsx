import { ConvertFormat } from '../types';

interface ConvertOptionsProps {
  convertFormat: ConvertFormat;
  isProcessing: boolean;
  onFormatChange: (format: ConvertFormat) => void;
}

const convertFormats: ConvertFormat[] = [
  "mp3",
  "wav",
  "m4a",
  "aac",
  "flac",
  "ogg",
  "opus",
  "mp4",
  "mkv",
  "mov",
  "avi",
  "webm",
];

export default function ConvertOptions({
  convertFormat,
  isProcessing,
  onFormatChange,
}: ConvertOptionsProps) {
  return (
    <div class="space-y-4">
      <label
        htmlFor="convertFormat"
        class="block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        Select output format:
      </label>
      <select
        id="convertFormat"
        value={convertFormat}
        onChange={(e) => onFormatChange((e.target as HTMLSelectElement).value as ConvertFormat)}
        disabled={isProcessing}
        class="mt-1 block w-full pl-3 pr-10 py-2.5 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50"
      >
        {convertFormats.map((format) => (
          <option key={format} value={format}>
            {format.toUpperCase()}
          </option>
        ))}
      </select>
    </div>
  );
}