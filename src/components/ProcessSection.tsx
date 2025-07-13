import { Operation, OutputMessage } from '../types';
import ProcessButton from './ProcessButton';
import StatusMessage from './StatusMessage';

interface ProcessSectionProps {
  selectedFile: File | null;
  operation: Operation;
  isProcessing: boolean;
  outputMessage: OutputMessage;
  onProcess: () => void;
}

export default function ProcessSection({
  selectedFile,
  operation,
  isProcessing,
  outputMessage,
  onProcess,
}: ProcessSectionProps) {
  return (
    <section class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
      <h2 class="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
        4. Process File
      </h2>
      <ProcessButton
        operation={operation}
        isProcessing={isProcessing}
        selectedFile={selectedFile}
        onProcess={onProcess}
      />
      <StatusMessage message={outputMessage} />
    </section>
  );
}