import { Operation } from '../types';

interface OperationSelectorProps {
  operation: Operation;
  isProcessing: boolean;
  onOperationChange: (operation: Operation) => void;
}

export default function OperationSelector({
  operation,
  isProcessing,
  onOperationChange,
}: OperationSelectorProps) {
  return (
    <section class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
      <h2 class="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
        2. Choose Operation
      </h2>
      <div class="flex flex-col sm:flex-row sm:justify-center space-y-3 sm:space-y-0 sm:space-x-4">
        <button
          onClick={() => onOperationChange("convert")}
          disabled={isProcessing}
          class={`w-full sm:w-auto px-8 py-3 font-semibold rounded-lg shadow-md transition-all duration-150 ease-in-out
                    ${
                      operation === "convert"
                        ? "bg-blue-600 text-white ring-2 ring-blue-400 ring-offset-2 dark:ring-offset-gray-800"
                        : "bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
                    }
                    ${
                      isProcessing ? "opacity-50 cursor-not-allowed" : ""
                    }`}
        >
          Convert
        </button>
        <button
          onClick={() => onOperationChange("trim")}
          disabled={isProcessing}
          class={`w-full sm:w-auto px-8 py-3 font-semibold rounded-lg shadow-md transition-all duration-150 ease-in-out
                    ${
                      operation === "trim"
                        ? "bg-blue-600 text-white ring-2 ring-blue-400 ring-offset-2 dark:ring-offset-gray-800"
                        : "bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
                    }
                    ${
                      isProcessing ? "opacity-50 cursor-not-allowed" : ""
                    }`}
        >
          Trim
        </button>
      </div>
    </section>
  );
}