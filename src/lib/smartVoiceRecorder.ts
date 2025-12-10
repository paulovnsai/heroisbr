import OpenAI from 'openai';

export class SmartVoiceRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private intervalId: number | null = null;
  private onChunkReady?: (blob: Blob) => void;

  async startRecording(onChunkReady?: (blob: Blob) => void): Promise<void> {
    try {
      this.onChunkReady = onChunkReady;
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(this.stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start();

      if (this.onChunkReady) {
        this.intervalId = window.setInterval(() => {
          if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.requestData();

            if (this.audioChunks.length > 0) {
              const audioBlob = new Blob([...this.audioChunks], { type: 'audio/webm' });
              this.onChunkReady!(audioBlob);
            }
          }
        }, 3000);
      }
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      throw new Error('Não foi possível acessar o microfone');
    }
  }

  stopRecording(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }
}

interface HeroFormData {
  name?: string;
  ideia?: string;
  observacao?: string;
  local?: string;
  ano?: string;
  artstyle?: string;
  storylength?: string;
}

export async function transcribeAndExtractFields(audioBlob: Blob): Promise<HeroFormData> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('Chave da API OpenAI não configurada');
  }

  const openai = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true,
  });

  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.webm');
  formData.append('model', 'whisper-1');
  formData.append('language', 'pt');

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Erro ao transcrever áudio');
  }

  const transcriptionData = await response.json();
  const transcribedText = transcriptionData.text;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `Você é um assistente que extrai informações de heróis brasileiros de um texto falado.
Extraia APENAS os campos mencionados pelo usuário e retorne em formato JSON.

Campos possíveis:
- name: nome do herói
- ideia: descrição do ato heroico
- observacao: observações adicionais
- local: cidade/estado onde ocorreu
- ano: ano do acontecimento
- artstyle: estilo artístico (se mencionado)
- storylength: tamanho da história (se mencionado)

Se o usuário disser "mudar" ou "alterar" um campo, inclua esse campo no JSON.

Retorne APENAS o JSON, sem explicações. Se não houver campos mencionados, retorne {}.

Exemplos:
"nome João Silva descrição salvou crianças de incêndio local São Paulo ano 2020"
-> {"name": "João Silva", "ideia": "salvou crianças de incêndio", "local": "São Paulo", "ano": "2020"}

"mudar o ano para 2021"
-> {"ano": "2021"}

"nome Maria observação professora dedicada"
-> {"name": "Maria", "observacao": "professora dedicada"}`
      },
      {
        role: 'user',
        content: transcribedText
      }
    ],
    temperature: 0.3,
  });

  const result = completion.choices[0].message.content;

  if (!result) {
    return {};
  }

  try {
    return JSON.parse(result);
  } catch (e) {
    console.error('Erro ao parsear resposta:', result);
    return {};
  }
}
