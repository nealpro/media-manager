import FileInputButton from './FileInputButton';

interface FileSelectorProps {
  fileName: string;
  onFileChange: (event: Event) => void;
}

export default function FileSelector({ fileName, onFileChange }: FileSelectorProps) {
  return (
    <section class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
      <h2 class="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
        1. Input File
      </h2>
      <FileInputButton
        id="fileInput"
        onChange={onFileChange}
        fileName={fileName}
      />
    </section>
  );
}