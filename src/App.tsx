import "./App.css";
import { useMediaProcessor } from './hooks/useMediaProcessor';
import Header from './components/Header';
import FileSelector from './components/FileSelector';
import OperationSelector from './components/OperationSelector';
import OperationOptions from './components/OperationOptions';
import ProcessSection from './components/ProcessSection';
import Footer from './components/Footer';

function App() {
  const {
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
  } = useMediaProcessor();

  return (
    <main class="container">
      <div class="w-full max-w-2xl mx-auto p-4 md:p-8 space-y-8">
        <Header />

        <FileSelector fileName={fileName} onFileChange={handleFileChange} />

        {selectedFile && (
          <OperationSelector
            operation={operation}
            isProcessing={isProcessing}
            onOperationChange={handleOperationChange}
          />
        )}

        {selectedFile && operation && (
          <OperationOptions
            operation={operation}
            convertFormat={convertFormat}
            trimStart={trimStart}
            trimEnd={trimEnd}
            isProcessing={isProcessing}
            onConvertFormatChange={handleConvertFormatChange}
            onTrimStartChange={handleTrimStartChange}
            onTrimEndChange={handleTrimEndChange}
          />
        )}

        {selectedFile && operation && (
          <ProcessSection
            selectedFile={selectedFile}
            operation={operation}
            isProcessing={isProcessing}
            outputMessage={outputMessage}
            onProcess={handleProcess}
          />
        )}

        <Footer />
      </div>
    </main>
  );
}

export default App;
