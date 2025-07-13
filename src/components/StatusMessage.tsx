import { OutputMessage } from '../types';
import { getMessageColor } from '../utils/validation';

interface StatusMessageProps {
  message: OutputMessage;
}

export default function StatusMessage({ message }: StatusMessageProps) {
  if (!message.text) return null;

  return (
    <p class={`mt-4 text-center text-sm ${getMessageColor(message.type)}`}>
      {message.text}
    </p>
  );
}