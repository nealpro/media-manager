interface FileInputButtonProps {
  id: string;
  onChange: (event: Event) => void;
  fileName?: string;
  accept?: string; // Optional MIME types for file selection
}

export default function FileInputButton({
  id,
  onChange,
  fileName,
  accept,
}: FileInputButtonProps) {
  return (
    <div class="w-full">
      <label
        htmlFor={id}
        class="w-full cursor-pointer bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition duration-150 ease-in-out block text-center"
      >
        {fileName ? `Selected: ${fileName}` : "Choose File"}
      </label>
      <input
        id={id}
        type="file"
        class="hidden"
        onChange={onChange}
        accept={accept || "audio/*,video/*"} // Common ffmpeg supported types
      />
    </div>
  );
}