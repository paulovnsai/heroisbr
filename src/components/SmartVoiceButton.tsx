import { useState } from 'react';
import { Mic, Square } from 'lucide-react';
import { SmartVoiceRecorder, ProcessingStatus } from '../lib/smartVoiceRecorder';

interface SmartVoiceButtonProps {
  onFieldsExtracted: (fields: Record<string, string>) => void;
  onStatusChange?: (status: ProcessingStatus, error?: string) => void;
}

export function SmartVoiceButton({ onFieldsExtracted, onStatusChange }: SmartVoiceButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recorder] = useState(() => new SmartVoiceRecorder());

  const handleToggleRecording = async () => {
    try {
      if (isRecording) {
        setIsRecording(false);
        recorder.stopRecording();
      } else {
        await recorder.startRecording(
          (result) => {
            if (Object.keys(result.fields).length > 0) {
              onFieldsExtracted(result.fields);
            }
          },
          (status, error) => {
            if (status === 'recording') {
              setIsRecording(true);
            } else {
              setIsRecording(false);
            }

            if (onStatusChange) {
              onStatusChange(status, error);
            }
          }
        );
      }
    } catch (error) {
      console.error('Erro ao processar voz:', error);
      setIsRecording(false);
      if (onStatusChange) {
        onStatusChange('error', error instanceof Error ? error.message : 'Erro ao processar áudio');
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggleRecording}
      className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
        isRecording
          ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg'
          : 'bg-green-500 text-white hover:bg-green-600 shadow-md'
      }`}
    >
      {isRecording ? (
        <>
          <Square size={20} fill="white" />
          <span className="animate-pulse">Parar Gravação</span>
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
