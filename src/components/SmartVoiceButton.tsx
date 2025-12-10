import { useState } from 'react';
import { Mic, Square } from 'lucide-react';
import { SmartVoiceRecorder, transcribeAndExtractFields } from '../lib/smartVoiceRecorder';

interface SmartVoiceButtonProps {
  onFieldsExtracted: (fields: Record<string, string>) => void;
}

export function SmartVoiceButton({ onFieldsExtracted }: SmartVoiceButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recorder] = useState(() => new SmartVoiceRecorder());
  const [isProcessing, setIsProcessing] = useState(false);

  const handleToggleRecording = async () => {
    try {
      if (isRecording) {
        setIsProcessing(true);
        const audioBlob = await recorder.stopRecording();
        setIsRecording(false);

        const extractedFields = await transcribeAndExtractFields(audioBlob);

        if (Object.keys(extractedFields).length > 0) {
          onFieldsExtracted(extractedFields);
        }

        setIsProcessing(false);
      } else {
        await recorder.startRecording();
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
      disabled={isProcessing}
      className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
        isRecording
          ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse shadow-lg'
          : 'bg-green-500 text-white hover:bg-green-600 shadow-md'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {isProcessing ? (
        <>
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Processando...
        </>
      ) : isRecording ? (
        <>
          <Square size={20} fill="white" />
          Parar Gravação
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
