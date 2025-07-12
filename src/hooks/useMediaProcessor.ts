import { useState } from "preact/hooks";
import { MediaProcessorState, Operation, ConvertFormat, OutputMessage } from '../types';
import { validateTimes, generateOutputFileName } from '../utils/validation';

export function useMediaProcessor(): MediaProcessorState & {
  handleFileChange: (event: Event) => void;
  handleOperationChange: (operation: Operation) => void;
  handleConvertFormatChange: (format: ConvertFormat) => void;
  handleTrimStartChange: (time: string) => void;
  handleTrimEndChange: (time: string) => void;
  handleProcess: () => Promise<void>;
  setOutputMessage: (message: OutputMessage) => void;
} {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [operation, setOperation] = useState<Operation>("");
  const [convertFormat, setConvertFormat] = useState<ConvertFormat>("mp3");
  const [trimStart, setTrimStart] = useState("00:00:00.000");
  const [trimEnd, setTrimEnd] = useState("00:00:10.000");
  const [isProcessing, setIsProcessing] = useState(false);
  const [outputMessage, setOutputMessage] = useState<OutputMessage>({ text: "", type: "" });

  const handleFileChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFileName(file.name);
      setOutputMessage({ text: "", type: "" }); // Clear previous messages
      setOperation(""); // Reset operation when a new file is selected
    }
  };

  const handleOperationChange = (op: Operation) => {
    setOperation(op);
    setOutputMessage({ text: "", type: "" });
  };

  const handleConvertFormatChange = (format: ConvertFormat) => {
    setConvertFormat(format);
  };

  const handleTrimStartChange = (time: string) => {
    setTrimStart(time);
  };

  const handleTrimEndChange = (time: string) => {
    setTrimEnd(time);
  };

  const handleProcess = async () => {
    if (!selectedFile) {
      setOutputMessage({ text: "Please select a file first.", type: "error" });
      return;
    }
    if (!operation) {
      setOutputMessage({ text: "Please select an operation.", type: "error" });
      return;
    }

    if (operation === "trim") {
      const validation = validateTimes(trimStart, trimEnd);
      if (!validation.isValid && validation.message) {
        setOutputMessage(validation.message);
        return;
      }
    }

    setIsProcessing(true);
    setOutputMessage({ text: "Processing... (mock operation)", type: "info" });

    const options = {
      inputFileName: fileName,
      operation,
    };

    console.log("Mock processing options:", options);

    try {
      // --- MOCK TAURI INVOCATION ---
      // In a real Tauri app, you would use:
      // const result = await invoke("your_ffmpeg_command", { options });
      // For UI demonstration, we'll simulate a delay.
      await new Promise((resolve) => setTimeout(resolve, 2000));
      // --- END MOCK ---

      const suggestedOutputName = generateOutputFileName(fileName, operation, convertFormat);

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

  return {
    selectedFile,
    fileName,
    operation,
    convertFormat,
    trimStart,
    trimEnd,
    isProcessing,
    outputMessage,
    handleFileChange,
    handleOperationChange,
    handleConvertFormatChange,
    handleTrimStartChange,
    handleTrimEndChange,
    handleProcess,
    setOutputMessage,
  };
}