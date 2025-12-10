import { useState, useRef } from 'react';
import { Mic, Square } from 'lucide-react';
import { SmartVoiceRecorder, transcribeAndExtractFields } from '../lib/smartVoiceRecorder';

interface SmartVoiceButtonProps {
  onFieldsExtracted: (fields: Record<string, string>) => void;
}

export function SmartVoiceButton({ onFieldsExtracted }: SmartVoiceButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recorder] = useState(() => new SmartVoiceRecorder());
  const [isProcessing, setIsProcessing] = useState(false);
  const processingRef = useRef(false);

  const handleToggleRecording = async () => {
    try {
      if (isRecording) {
        recorder.stopRecording();
        setIsRecording(false);
        setIsProcessing(false);
      } else {
        await recorder.startRecording(async (audioBlob) => {
          if (processingRef.current) return;

          processingRef.current = true;
          setIsProcessing(true);

          try {
            const extractedFields = await transcribeAndExtractFields(audioBlob);

            if (Object.keys(extractedFields).length > 0) {
              onFieldsExtracted(extractedFields);
            }
          } catch (error) {
            console.error('Erro ao processar chunk:', error);
          } finally {
            processingRef.current = false;
            setIsProcessing(false);
          }
        });
        setIsRecording(true);
      }
    } catch (error) {
      console.error('Erro ao processar voz:', error);
      alert(error instanceof Error ? error.message : 'Erro ao processar áudio');
      setIsRecording(false);
      setIsProcessing(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggleRecording}
      className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
        isRecording
          ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse shadow-lg'
          : 'bg-green-500 text-white hover:bg-green-600 shadow-md'
      }`}
    >
      {isRecording ? (
        <>
          <Square size={20} fill="white" />
          Parar Gravação
          {isProcessing && (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-1" />
          )}
        </>
      ) : (
        <>
          <Mic size={20} />
          Gravar Campos por Voz
        </>
      )}
    </button>
  );
}
