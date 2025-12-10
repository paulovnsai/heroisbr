import { useState, useRef } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';

interface AudioRecorderProps {
  onTranscriptionComplete: (data: any) => void;
  supabaseUrl: string;
  openaiKey: string;
}

export function AudioRecorder({ onTranscriptionComplete, supabaseUrl, openaiKey }: AudioRecorderProps) {
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
      console.log('Tamanho do áudio:', audioBlob.size, 'bytes');

      if (audioBlob.size < 1000) {
        throw new Error('Áudio muito curto. Grave por pelo menos 2 segundos.');
      }

      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);

      reader.onloadend = async () => {
        try {
          console.log('Convertendo áudio para enviar à OpenAI...');

          const formData = new FormData();
          formData.append('file', audioBlob, 'audio.webm');
          formData.append('model', 'whisper-1');
          formData.append('language', 'pt');

          console.log('Enviando para Whisper API...');
          const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiKey}`,
            },
            body: formData,
          });

          if (!transcriptionResponse.ok) {
            const errorText = await transcriptionResponse.text();
            console.error('Erro na transcrição:', errorText);
            throw new Error(`Erro na transcrição: ${transcriptionResponse.status}`);
          }

          const transcriptionData = await transcriptionResponse.json();
          const transcribedText = transcriptionData.text;
          console.log('Transcrição:', transcribedText);

          console.log('Extraindo dados estruturados com GPT...');
          const extractionPrompt = `Você é um assistente que extrai informações de heróis brasileiros a partir de uma transcrição.

Transcrição: "${transcribedText}"

Extraia as seguintes informações:
- name: Nome do vídeo/título que identifica este herói (deve ser o nome completo da pessoa mencionada)
- ideia: Descrição completa do ato heroico e da história

IMPORTANTE: O campo "name" deve conter o nome da pessoa que é o herói da história. Este será o título do vídeo.

Retorne APENAS um JSON válido com os campos encontrados. Se um campo não for mencionado, use string vazia. Exemplo:
{
  "name": "Maria Silva",
  "ideia": "Salvou crianças de um incêndio em São Paulo no ano de 2020, demonstrando grande coragem ao entrar no prédio em chamas"
}`;

          const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                { role: 'system', content: 'Você é um assistente que extrai dados estruturados de texto. Retorne apenas JSON válido.' },
                { role: 'user', content: extractionPrompt }
              ],
              temperature: 0.3,
            }),
          });

          if (!gptResponse.ok) {
            const errorText = await gptResponse.text();
            console.error('Erro ao extrair dados:', errorText);
            throw new Error(`Erro ao extrair dados: ${gptResponse.status}`);
          }

          const gptData = await gptResponse.json();
          const extractedDataText = gptData.choices[0].message.content;

          let extractedData;
          try {
            extractedData = JSON.parse(extractedDataText);
          } catch (e) {
            const jsonMatch = extractedDataText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              extractedData = JSON.parse(jsonMatch[0]);
            } else {
              throw new Error('Não foi possível extrair JSON da resposta');
            }
          }

          console.log('Dados extraídos:', extractedData);
          console.log('Preenchendo campos automaticamente...');
          onTranscriptionComplete(extractedData);
        } catch (error) {
          console.error('Erro ao processar áudio:', error);
          alert(`Erro: ${error instanceof Error ? error.message : 'Erro ao processar o áudio'}`);
        } finally {
          setIsProcessing(false);
        }
      };

      reader.onerror = () => {
        console.error('Erro ao ler arquivo de áudio');
        alert('Erro ao ler o arquivo de áudio');
        setIsProcessing(false);
      };
    } catch (error) {
      console.error('Erro ao processar áudio:', error);
      alert(`Erro: ${error instanceof Error ? error.message : 'Erro ao processar o áudio'}`);
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
