import { Operation, ConvertFormat } from '../types';
import ConvertOptions from './ConvertOptions';
import TrimOptions from './TrimOptions';

interface OperationOptionsProps {
  operation: Operation;
  convertFormat: ConvertFormat;
  trimStart: string;
  trimEnd: string;
  isProcessing: boolean;
  onConvertFormatChange: (format: ConvertFormat) => void;
  onTrimStartChange: (time: string) => void;
  onTrimEndChange: (time: string) => void;
}

export default function OperationOptions({
  operation,
  convertFormat,
  trimStart,
  trimEnd,
  isProcessing,
  onConvertFormatChange,
  onTrimStartChange,
  onTrimEndChange,
}: OperationOptionsProps) {
  return (
    <section class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
      <h2 class="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-200">
        3. Options for{" "}
        <span class="capitalize text-blue-600 dark:text-blue-400">
          {operation}
        </span>
      </h2>

      {/* Convert Options */}
      {operation === "convert" && (
        <ConvertOptions
          convertFormat={convertFormat}
          isProcessing={isProcessing}
          onFormatChange={onConvertFormatChange}
        />
      )}

      {/* Trim Options */}
      {operation === "trim" && (
        <TrimOptions
          trimStart={trimStart}
          trimEnd={trimEnd}
          isProcessing={isProcessing}
          onStartTimeChange={onTrimStartChange}
          onEndTimeChange={onTrimEndChange}
        />
      )}
    </section>
  );
}