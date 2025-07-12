import { Operation } from '../types';

interface ProcessButtonProps {
  operation: Operation;
  isProcessing: boolean;
  selectedFile: File | null;
  onProcess: () => void;
}

export default function ProcessButton({
  operation,
  isProcessing,
  selectedFile,
  onProcess,
}: ProcessButtonProps) {
  return (
    <button
      onClick={onProcess}
      disabled={isProcessing || !selectedFile || !operation}
      class={`w-full text-lg font-semibold py-3 px-6 rounded-lg shadow-xl transition duration-150 ease-in-out
                ${
                  isProcessing || !selectedFile || !operation
                    ? "bg-gray-400 dark:bg-gray-600 text-gray-700 dark:text-gray-400 cursor-not-allowed"
                    : "bg-green-500 hover:bg-green-600 text-white"
                }`}
    >
      {isProcessing ? (
        <div class="flex items-center justify-center">
          <svg
            class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Processing...
        </div>
      ) : (
        `Run ${operation} & Save As...`
      )}
    </button>
  );
}