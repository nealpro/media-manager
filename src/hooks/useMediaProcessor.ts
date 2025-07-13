import { useState } from "preact/hooks";
import { MediaProcessorState, Operation, ConvertFormat, OutputMessage } from '../types';
import { validateTimes, generateOutputFileName } from '../utils/validation';
import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";

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
    setOutputMessage({ text: "Processing...", type: "info" });

    try {
      // Initialize FFmpeg sidecar
      await invoke("init");

      // Convert File to byte array
      const fileData = await selectedFile.arrayBuffer();
      const fileBytes = new Uint8Array(fileData);

      // Write file to temporary location
      const tempInputPath = await invoke("write_temp_file", { 
        fileData: Array.from(fileBytes), 
        originalName: fileName 
      }) as string;

      // Generate output filename and path using backend
      const suggestedOutputName = generateOutputFileName(fileName, operation, convertFormat);
      const tempOutputPath = await invoke("generate_temp_output_path", {
        originalName: fileName,
        operation: operation,
        format: convertFormat
      }) as string;

      // Process the file based on operation
      let processedPath: string;
      if (operation === "convert") {
        processedPath = await invoke("transcode", {
          input: tempInputPath,
          output: tempOutputPath,
          outEncoding: convertFormat
        }) as string;
      } else if (operation === "trim") {
        processedPath = await invoke("trim", {
          input: tempInputPath,
          output: tempOutputPath,
          start: trimStart,
          end: trimEnd
        }) as string;
      } else {
        throw new Error("Unsupported operation");
      }

      // Let user choose where to save the processed file
      const finalPath = await save({
        defaultPath: suggestedOutputName,
        filters: [{
          name: "Media Files",
          extensions: operation === "convert" ? [convertFormat] : ["mp4", "mkv", "mov", "avi", "webm", "mp3", "wav", "m4a", "aac", "flac", "ogg", "opus"]
        }]
      });

      if (finalPath) {
        // Move processed file to final location
        await invoke("move_processed_file", {
          tempPath: processedPath,
          finalPath: finalPath
        });

        setOutputMessage({
          text: `File successfully processed and saved to ${finalPath}`,
          type: "success",
        });
      } else {
        setOutputMessage({
          text: "Save cancelled by user.",
          type: "info",
        });
      }
    } catch (error) {
      console.error("Error during processing:", error);
      if (error instanceof Error) {
        const errorMessage =
          error.message ||
          (typeof error === "string"
            ? error
            : "An unknown error occurred during processing.");
        setOutputMessage({
          text: `Error: ${errorMessage}`,
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