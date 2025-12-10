import { useState } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { VoiceRecorder, transcribeAudio } from '../lib/voiceRecorder';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  fieldName: string;
}

export function VoiceInput({ onTranscript, fieldName }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recorder] = useState(() => new VoiceRecorder());
  const [isProcessing, setIsProcessing] = useState(false);

  const handleToggleRecording = async () => {
    try {
      if (isRecording) {
        setIsProcessing(true);
        const audioBlob = await recorder.stopRecording();
        setIsRecording(false);

        const transcript = await transcribeAudio(audioBlob);
        onTranscript(transcript);
        setIsProcessing(false);
      } else {
        await recorder.startRecording();
        setIsRecording(true);
      }
    } catch (error) {
      console.error('Erro ao gravar/transcrever:', error);
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
      className={`p-2 rounded-lg transition-all ${
        isRecording
          ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
      title={isRecording ? `Parar gravação de ${fieldName}` : `Gravar ${fieldName}`}
    >
      {isProcessing ? (
        <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
      ) : isRecording ? (
        <MicOff size={20} />
      ) : (
        <Mic size={20} />
      )}
    </button>
  );
}
