import { useState } from 'react';
import { Mic, Square, ExternalLink } from 'lucide-react';
import { SmartVoiceRecorder } from '../lib/smartVoiceRecorder';

interface SmartVoiceButtonProps {
  onFieldsExtracted: (fields: Record<string, string>) => void;
}

export function SmartVoiceButton({ onFieldsExtracted }: SmartVoiceButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [n8nLink, setN8nLink] = useState<string | null>(null);
  const [recorder] = useState(() => new SmartVoiceRecorder());

  const handleToggleRecording = async () => {
    try {
      if (isRecording) {
        setIsRecording(false);
        setIsProcessing(true);
        setN8nLink(null);
        recorder.stopRecording();
      } else {
        setN8nLink(null);
        await recorder.startRecording((result) => {
          if (Object.keys(result.fields).length > 0) {
            onFieldsExtracted(result.fields);
            if (result.n8nLink) {
              setN8nLink(result.n8nLink);
            }
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
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={handleToggleRecording}
        disabled={isProcessing}
        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
          isProcessing
            ? 'bg-blue-500 text-white cursor-wait shadow-lg'
            : isRecording
            ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg'
            : 'bg-green-500 text-white hover:bg-green-600 shadow-md'
        }`}
      >
        {isProcessing ? (
          <>
            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
            <span className="animate-pulse">Processando áudio...</span>
          </>
        ) : isRecording ? (
          <>
            <Square size={20} fill="white" />
            <span className="animate-pulse">Gravando... Clique para parar</span>
          </>
        ) : (
          <>
            <Mic size={20} />
            Gravar Campos por Voz
          </>
        )}
      </button>

      {n8nLink && (
        <a
          href={n8nLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md font-medium"
        >
          <ExternalLink size={20} />
          Abrir Resultado do n8n
        </a>
      )}
    </div>
  );
}
