import { useState } from "preact/hooks";
// import { invoke } from "@tauri-apps/api/core"; // For actual Tauri backend calls
// import { save } from '@tauri-apps/api/dialog'; // For native save dialog
import "./App.css"; // Your existing CSS. Ensure Tailwind directives are also processed.

// Helper component for a visually better file input
function FileInputButton({
  id,
  onChange,
  fileName,
  accept,
}: {
  id: string;
  onChange: (event: Event) => void;
  fileName?: string;
  accept?: string; // Optional MIME types for file selection
}) {
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

// // Helper component for radio buttons
// function RadioButton({
//   id,
//   name,
//   value,
//   label,
//   checked,
//   onChange,
// }: {
//   id: string;
//   name: string;
//   value: string;
//   label: string;
//   checked: boolean;
//   onChange: (event: Event) => void;
// }) {
//   return (
//     <label
//       htmlFor={id}
//       class="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
//     >
//       <input
//         type="radio"
//         id={id}
//         name={name}
//         value={value}
//         checked={checked}
//         onChange={onChange}
//         class="form-radio h-5 w-5 text-blue-600 border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-500 dark:bg-gray-800 dark:checked:bg-blue-500"
//       />
//       <span class="text-gray-800 dark:text-gray-200">{label}</span>
//     </label>
//   );
// }

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [operation, setOperation] = useState(""); // 'convert', 'trim'

  // Convert operation states
  const [convertFormat, setConvertFormat] = useState("mp3");
  const convertFormats = [
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

  // Trim operation states
  const [trimStart, setTrimStart] = useState("00:00:00.000");
  const [trimEnd, setTrimEnd] = useState("00:00:10.000");

  const [isProcessing, setIsProcessing] = useState(false);
  const [outputMessage, setOutputMessage] = useState({ text: "", type: "" }); // type: 'success', 'error', 'info'

  const handleFileChange = (event: any) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      // In a real Tauri app, you might get the full path via `file.path` if available,
      // or handle file differently for backend processing.
      // For this UI demo, `file.name` is sufficient.
      setFileName(file.name);
      setOutputMessage({ text: "", type: "" }); // Clear previous messages
      setOperation(""); // Reset operation when a new file is selected
    }
  };

  const handleOperationChange = (op: any) => {
    setOperation(op);
    setOutputMessage({ text: "", type: "" });
  };

  const validateTimes = () => {
    // Basic regex for HH:MM:SS.mmm or HH:MM:SS
    const timeRegex =
      /^([0-1]?[0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])(\.\d{1,3})?$/;
    if (!timeRegex.test(trimStart)) {
      setOutputMessage({
        text: "Invalid start time format. Use HH:MM:SS or HH:MM:SS.mmm",
        type: "error",
      });
      return false;
    }
    if (!timeRegex.test(trimEnd)) {
      setOutputMessage({
        text: "Invalid end time format. Use HH:MM:SS or HH:MM:SS.mmm",
        type: "error",
      });
      return false;
    }
    // Further validation could convert to seconds and compare, e.g. start < end
    // This is a simplified check for now.
    if (trimStart >= trimEnd) {
      setOutputMessage({
        text: "Error: Trim start time must be before end time.",
        type: "error",
      });
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!selectedFile) {
      setOutputMessage({ text: "Please select a file first.", type: "error" });
      return;
    }
    if (!operation) {
      setOutputMessage({ text: "Please select an operation.", type: "error" });
      return;
    }

    if (operation === "trim" && !validateTimes()) {
      return; // validateTimes will set the error message
    }

    setIsProcessing(true);
    setOutputMessage({ text: "Processing... (mock operation)", type: "info" });

    const options = {
      // In a real Tauri app, you'd pass the file path or its contents:
      // filePath: selectedFile.path (if available and security allows direct path access from JS)
      // or handle file transfer through Tauri's APIs
      inputFileName: fileName,
      operation,
    };

    // if (operation === "convert") {
    //   options.format = convertFormat;
    // } else if (operation === "trim") {
    //   options.startTime = trimStart;
    //   options.endTime = trimEnd;
    // }

    console.log("Mock processing options:", options);

    try {
      // --- MOCK TAURI INVOCATION ---
      // In a real Tauri app, you would use:
      // const result = await invoke("your_ffmpeg_command", { options });
      // For UI demonstration, we'll simulate a delay.
      await new Promise((resolve) => setTimeout(resolve, 2000));
      // --- END MOCK ---

      let suggestedOutputName = "";
      const nameWithoutExtension =
        fileName.substring(0, fileName.lastIndexOf(".")) || fileName;

      if (operation === "convert") {
        suggestedOutputName = `${nameWithoutExtension}_converted.${convertFormat}`;
      } else if (operation === "trim") {
        // Try to keep original extension for trim if it's a video format, or use a common one.
        const originalExtension = (
          fileName.lastIndexOf(".") > -1
            ? fileName.substring(fileName.lastIndexOf(".") + 1)
            : "mp4"
        ).toLowerCase();
        const videoExtensions = ["mp4", "mkv", "mov", "avi", "webm"];
        const audioExtensions = [
          "mp3",
          "wav",
          "m4a",
          "aac",
          "flac",
          "ogg",
          "opus",
        ];

        let outputExtension = originalExtension;
        if (videoExtensions.includes(originalExtension)) {
          outputExtension = originalExtension; // Keep original video extension
        } else if (audioExtensions.includes(originalExtension)) {
          outputExtension = originalExtension; // Keep original audio extension
        } else {
          // Fallback if extension is unknown or not typically trimmable directly
          // Or, if your ffmpeg logic converts trimmed non-media files to a default (e.g., mp4)
          outputExtension = "mp4";
        }
        suggestedOutputName = `${nameWithoutExtension}_trimmed.${outputExtension}`;
      }

      setOutputMessage({
        text: `Mock Success! Suggested output name: ${suggestedOutputName}.`,
        type: "success",
      });

      // In a real Tauri app, you might trigger a save dialog here:
      // const filePath = await save({ defaultPath: suggestedOutputName });
      // if (filePath) {
      //   await invoke("save_processed_file_command", { tempFilePath: result.outputPath, finalSavePath: filePath });
      //   setOutputMessage({ text: `File saved to ${filePath}`, type: "success" });
      // } else {
      //   setOutputMessage({ text: "Save cancelled by user.", type: "info" });
      // }
    } catch (error) {
      console.error("Mock error during processing:", error);
      if (error instanceof Error) {
        const errorMessage =
          error.message ||
          (typeof error === "string"
            ? error
            : "An unknown error occurred during processing.");
        setOutputMessage({
          text: `Error: ${errorMessage} (mock error)`,
          type: "error",
        });
      } else {
        setOutputMessage({
          text: "An unknown error occurred during processing.",
          type: "error",
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const getMessageColor = () => {
    switch (outputMessage.type) {
      case "success":
        return "text-green-600 dark:text-green-400";
      case "error":
        return "text-red-600 dark:text-red-400";
      case "info":
        return "text-blue-600 dark:text-blue-400";
      default:
        return "text-gray-700 dark:text-gray-300";
    }
  };

  return (
    // Using the .container class from your App.css for overall centering and top padding
    // Added min-h-screen and bg-gray-50 dark:bg-gray-900 for full page background
    <main class="container">
      <div class="w-full max-w-2xl mx-auto p-4 md:p-8 space-y-8">
        <header class="text-center">
          <h1 class="text-3xl md:text-4xl font-bold text-blue-600 dark:text-blue-400">
            Reveal: Media Tools
          </h1>
          <p class="text-md text-gray-600 dark:text-gray-400 mt-2">
            Select a file and choose an operation.
          </p>
        </header>

        {/* Step 1: File Input */}
        <section class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h2 class="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
            1. Input File
          </h2>
          <FileInputButton
            id="fileInput"
            onChange={handleFileChange}
            fileName={fileName}
          />
        </section>

        {/* Step 2: Operation Selection (conditional) */}
        {selectedFile && (
          <section class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <h2 class="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
              2. Choose Operation
            </h2>
            <div class="flex flex-col sm:flex-row sm:justify-center space-y-3 sm:space-y-0 sm:space-x-4">
              <button
                onClick={() => handleOperationChange("convert")}
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
                onClick={() => handleOperationChange("trim")}
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
        )}

        {/* Step 3: Operation Options (conditional) */}
        {selectedFile && operation && (
          <section class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <h2 class="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-200">
              3. Options for{" "}
              <span class="capitalize text-blue-600 dark:text-blue-400">
                {operation}
              </span>
            </h2>

            {/* Convert Options */}
            {operation === "convert" && (
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
                  // onChange={(e) => setConvertFormat(e.target.value)}
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
            )}

            {/* Trim Options */}
            {operation === "trim" && (
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
                    // onInput={(e) => setTrimStart(e.target.value)}
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
                    // onInput={(e) => setTrimEnd(e.target.value)}
                    disabled={isProcessing}
                    class="mt-1 block w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50"
                  />
                </div>
              </div>
            )}
          </section>
        )}

        {/* Step 4: Save Button & Output Message (conditional) */}
        {selectedFile && operation && (
          <section class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <h2 class="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
              4. Process File
            </h2>
            <button
              onClick={handleSave}
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
            {outputMessage.text && (
              <p class={`mt-4 text-center text-sm ${getMessageColor()}`}>
                {outputMessage.text}
              </p>
            )}
          </section>
        )}

        {/* Footer - optional */}
        <footer class="text-center mt-12 py-4 border-t border-gray-200 dark:border-gray-700">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Made with ❤️ by Reveal Team.
          </p>
        </footer>
      </div>
    </main>
  );
}

export default App;
