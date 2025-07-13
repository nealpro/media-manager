interface TrimOptionsProps {
  trimStart: string;
  trimEnd: string;
  isProcessing: boolean;
  onStartTimeChange: (time: string) => void;
  onEndTimeChange: (time: string) => void;
}

export default function TrimOptions({
  trimStart,
  trimEnd,
  isProcessing,
  onStartTimeChange,
  onEndTimeChange,
}: TrimOptionsProps) {
  return (
    <div class="space-y-6">
      <div>
        <label
          htmlFor="trimStart"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Start Time (HH:MM:SS or HH:MM:SS.mmm)
        </label>
        <input
          type="text"
          id="trimStart"
          value={trimStart}
          placeholder="00:00:00.000"
          onInput={(e) => onStartTimeChange((e.target as HTMLInputElement).value)}
          disabled={isProcessing}
          class="mt-1 block w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50"
        />
      </div>
      <div>
        <label
          htmlFor="trimEnd"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          End Time (HH:MM:SS or HH:MM:SS.mmm)
        </label>
        <input
          type="text"
          id="trimEnd"
          value={trimEnd}
          placeholder="00:00:10.000"
          onInput={(e) => onEndTimeChange((e.target as HTMLInputElement).value)}
          disabled={isProcessing}
          class="mt-1 block w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50"
        />
      </div>
    </div>
  );
}