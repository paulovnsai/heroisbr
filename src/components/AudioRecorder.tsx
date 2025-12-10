import { useState, useRef } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';

interface AudioRecorderProps {
  onTranscriptionComplete: (data: any) => void;
  supabaseUrl: string;
}

export function AudioRecorder({ onTranscriptionComplete, supabaseUrl }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        await processAudio();
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      alert('Erro ao acessar o microfone. Verifique as permissões.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async () => {
    setIsProcessing(true);

    try {
      const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });

      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);

      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];

        const response = await fetch(
          `${supabaseUrl}/functions/v1/transcribe-hero-audio`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ audioData: base64Audio }),
          }
        );

        if (!response.ok) {
          throw new Error('Erro ao processar áudio');
        }

        const result = await response.json();

        if (result.success) {
          onTranscriptionComplete(result.data);
        } else {
          throw new Error(result.error || 'Erro desconhecido');
        }
      };
    } catch (error) {
      console.error('Erro ao processar áudio:', error);
      alert('Erro ao processar o áudio. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-800 mb-1">
            Gravar Informações por Áudio
          </h3>
          <p className="text-xs text-gray-600">
            {isRecording
              ? 'Gravando... Fale as informações do herói'
              : isProcessing
              ? 'Processando áudio...'
              : 'Clique para gravar e preencher os campos automaticamente'}
          </p>
        </div>

        {isProcessing ? (
          <div className="flex items-center gap-2 px-6 py-3 bg-gray-400 text-white rounded-lg cursor-not-allowed">
            <Loader2 size={20} className="animate-spin" />
            <span className="font-medium">Processando...</span>
          </div>
        ) : isRecording ? (
          <button
            type="button"
            onClick={stopRecording}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors animate-pulse"
          >
            <Square size={20} />
            <span className="font-medium">Parar Gravação</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={startRecording}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Mic size={20} />
            <span className="font-medium">Gravar</span>
          </button>
        )}
      </div>

      {isRecording && (
        <div className="mt-3 flex items-center gap-2 text-red-600">
          <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">Gravando...</span>
        </div>
      )}
    </div>
  );
}
