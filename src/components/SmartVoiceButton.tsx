import { useState } from 'react';
import { Mic, Square } from 'lucide-react';
import { SmartVoiceRecorder } from '../lib/smartVoiceRecorder';

interface SmartVoiceButtonProps {
  onFieldsExtracted: (fields: Record<string, string>) => void;
}

export function SmartVoiceButton({ onFieldsExtracted }: SmartVoiceButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recorder] = useState(() => new SmartVoiceRecorder());

  const handleToggleRecording = async () => {
    try {
      if (isRecording) {
        recorder.stopRecording();
        setIsRecording(false);
      } else {
        await recorder.startRecording((fields) => {
          if (Object.keys(fields).length > 0) {
            onFieldsExtracted(fields);
          }
        });
        setIsRecording(true);
      }
    } catch (error) {
      console.error('Erro ao processar voz:', error);
      alert(error instanceof Error ? error.message : 'Erro ao processar áudio');
      setIsRecording(false);
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
          <span className="animate-pulse">Ouvindo em tempo real...</span>
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
