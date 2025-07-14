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
      console.log("Starting media processing for file:", fileName);
      
      // Check if Tauri is available by attempting to call a safe function
      console.log("Checking Tauri availability...");
      try {
        // Try to access a basic Tauri API to verify it's available
        await import("@tauri-apps/api/core");
        console.log("Tauri is available");
      } catch (error) {
        console.error("Tauri is not available:", error);
        throw new Error("Tauri runtime is not available. Please ensure the application is running in a Tauri environment.");
      }
      
      // Convert File to byte array
      console.log("Step 1: Converting file to byte array");
      let fileData: ArrayBuffer;
      let fileBytes: Uint8Array;
      try {
        fileData = await selectedFile.arrayBuffer();
        fileBytes = new Uint8Array(fileData);
        console.log("File converted to byte array successfully, size:", fileBytes.length);
      } catch (error) {
        console.error("Error converting file to byte array:", error);
        throw new Error(`Failed to read file data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Write file to temporary location
      console.log("Step 2: Writing file to temporary location");
      let tempInputPath: string;
      try {
        console.log("Attempting to invoke write_temp_file...");
        tempInputPath = await invoke("write_temp_file", { 
          fileData: Array.from(fileBytes), 
          originalName: fileName 
        }) as string;
        console.log("File written to temporary location:", tempInputPath);
      } catch (error) {
        console.error("Error writing temp file:", error);
        console.error("Error details:", {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : 'No stack'
        });
        throw new Error(`Failed to write temporary file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Generate output filename and path using backend
      console.log("Step 3: Generating output paths");
      const suggestedOutputName = generateOutputFileName(fileName, operation, convertFormat);
      console.log("Suggested output name:", suggestedOutputName);
      
      let tempOutputPath: string;
      try {
        console.log("Attempting to invoke generate_temp_output_path...");
        tempOutputPath = await invoke("generate_temp_output_path", {
          originalName: fileName,
          operation: operation,
          format: convertFormat
        }) as string;
        console.log("Temporary output path generated:", tempOutputPath);
      } catch (error) {
        console.error("Error generating temp output path:", error);
        console.error("Error details:", {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : 'No stack'
        });
        throw new Error(`Failed to generate temporary output path: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Process the file based on operation
      console.log("Step 4: Processing file with operation:", operation);
      let processedPath: string;
      try {
        if (operation === "convert") {
          console.log("Converting to format:", convertFormat);
          console.log("Input path:", tempInputPath);
          console.log("Output path:", tempOutputPath);
          console.log("Output encoding:", convertFormat);
          
          // Validate parameters before calling transcode
          if (!tempInputPath || !tempOutputPath || !convertFormat) {
            throw new Error("Missing required parameters for transcode operation");
          }
          
          console.log("Attempting to invoke transcode...");
          
          // Add timeout for long-running operations
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error("Transcode operation timed out after 5 minutes")), 5 * 60 * 1000);
          });
          
          processedPath = await Promise.race([
            invoke("transcode", {
              input: tempInputPath,
              output: tempOutputPath,
              outEncoding: convertFormat
            }) as Promise<string>,
            timeoutPromise
          ]);
          console.log("Transcoding completed, output at:", processedPath);
        } else if (operation === "trim") {
          console.log("Trimming from", trimStart, "to", trimEnd);
          console.log("Input path:", tempInputPath);
          console.log("Output path:", tempOutputPath);
          console.log("Start time:", trimStart);
          console.log("End time:", trimEnd);
          console.log("Attempting to invoke trim...");
          
          processedPath = await invoke("trim", {
            input: tempInputPath,
            output: tempOutputPath,
            start: trimStart,
            end: trimEnd
          }) as string;
          console.log("Trimming completed, output at:", processedPath);
        } else {
          throw new Error(`Unsupported operation: ${operation}`);
        }
      } catch (error) {
        console.error(`Error during ${operation} operation:`, error);
        
        // More comprehensive error logging
        if (error instanceof Error) {
          console.error("Error details:", {
            name: error.name,
            message: error.message,
            stack: error.stack,
            cause: (error as any).cause || 'No cause available'
          });
        } else {
          console.error("Non-Error object:", {
            type: typeof error,
            value: error,
            stringified: String(error),
            json: JSON.stringify(error, null, 2)
          });
        }
        
        // Check if it's a Tauri invoke error with additional properties
        if (error && typeof error === 'object') {
          console.error("Error object properties:", Object.keys(error));
          console.error("Error toString:", error.toString());
          
          // Check for common Tauri error properties
          if ('message' in error) {
            console.error("Tauri error message:", error.message);
          }
          if ('code' in error) {
            console.error("Tauri error code:", error.code);
          }
          if ('details' in error) {
            console.error("Tauri error details:", error.details);
          }
        }
        
        throw new Error(`Failed to ${operation} file: ${error instanceof Error ? error.message : String(error)}`);
      }

      // Let user choose where to save the processed file
      console.log("Step 5: Showing save dialog");
      let finalPath: string | null;
      try {
        console.log("Attempting to show save dialog...");
        finalPath = await save({
          defaultPath: suggestedOutputName,
          filters: [{
            name: "Media Files",
            extensions: operation === "convert" ? [convertFormat] : ["mp4", "mkv", "mov", "avi", "webm", "mp3", "wav", "m4a", "aac", "flac", "ogg", "opus"]
          }]
        });
        console.log("Save dialog result:", finalPath ? `Selected: ${finalPath}` : "Cancelled");
      } catch (error) {
        console.error("Error showing save dialog:", error);
        console.error("Error details:", {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : 'No stack'
        });
        throw new Error(`Failed to show save dialog: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      if (finalPath) {
        // Move processed file to final location
        console.log("Step 6: Moving processed file to final location");
        try {
          console.log("Attempting to invoke move_processed_file...");
          await invoke("move_processed_file", {
            tempPath: processedPath,
            finalPath: finalPath
          });
          console.log("File successfully moved to final location:", finalPath);
          
          setOutputMessage({
            text: `File successfully processed and saved to ${finalPath}`,
            type: "success",
          });
        } catch (error) {
          console.error("Error moving processed file:", error);
          console.error("Error details:", {
            name: error instanceof Error ? error.name : 'Unknown',
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : 'No stack'
          });
          throw new Error(`Failed to save file to final location: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      } else {
        console.log("Save cancelled by user");
        setOutputMessage({
          text: "Save cancelled by user.",
          type: "info",
        });
      }
    } catch (error) {
      console.error("Error during processing - Full error object:", error);
      console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace available');
      console.error("Window object:", typeof window !== 'undefined' ? 'Available' : 'Undefined');
      
      if (error instanceof Error) {
        const errorMessage = error.message || "An unknown error occurred during processing.";
        console.error("Final error message:", errorMessage);
        setOutputMessage({
          text: `Error: ${errorMessage}`,
          type: "error",
        });
      } else {
        console.error("Non-Error object thrown:", typeof error, error);
        setOutputMessage({
          text: "An unknown error occurred during processing.",
          type: "error",
        });
      }
    } finally {
      console.log("Processing completed, setting isProcessing to false");
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