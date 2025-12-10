interface HeroFormData {
  name?: string;
  ideia?: string;
  observacao?: string;
  local?: string;
  ano?: string;
  artstyle?: string;
  storylength?: string;
}

export class SmartVoiceRecorder {
  private ws: WebSocket | null = null;
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private onFieldsUpdate?: (fields: HeroFormData) => void;
  private conversationHistory: string = '';

  async startRecording(onFieldsUpdate?: (fields: HeroFormData) => void): Promise<void> {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('Chave da API OpenAI não configurada');
    }

    this.onFieldsUpdate = onFieldsUpdate;

    this.ws = new WebSocket(
      `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17`,
      ['realtime', `openai-insecure-api-key.${apiKey}`, 'openai-beta.realtime-v1']
    );

    this.ws.onopen = () => {
      this.ws?.send(JSON.stringify({
        type: 'session.update',
        session: {
          modalities: ['text', 'audio'],
          instructions: `Você é um assistente que extrai informações de heróis brasileiros enquanto o usuário fala.

Extraia APENAS os campos mencionados e retorne SOMENTE o JSON atualizado, sem nenhuma explicação adicional.

Campos possíveis:
- name: nome do herói
- ideia: descrição do ato heroico
- observacao: observações adicionais
- local: cidade/estado onde ocorreu
- ano: ano do acontecimento
- artstyle: estilo artístico (se mencionado)
- storylength: tamanho da história (se mencionado)

IMPORTANTE:
- Retorne APENAS o JSON com os campos mencionados
- Se o usuário disser "mudar" ou "alterar" um campo, atualize esse campo
- Não adicione explicações ou texto além do JSON

Exemplo de resposta:
{"name": "João Silva", "ideia": "salvou crianças de incêndio", "local": "São Paulo", "ano": "2020"}`,
          voice: 'alloy',
          input_audio_format: 'pcm16',
          output_audio_format: 'pcm16',
          input_audio_transcription: {
            model: 'whisper-1'
          },
          turn_detection: {
            type: 'server_vad',
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 200
          },
          temperature: 0.3
        }
      }));
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'response.text.delta') {
          this.processTextResponse(data.delta || '');
        }

        if (data.type === 'response.text.done') {
          this.processTextResponse(data.text || '');
        }

        if (data.type === 'response.done') {
          const output = data.response?.output;

          if (output && output.length > 0) {
            for (const item of output) {
              if (item.type === 'message' && item.content) {
                for (const content of item.content) {
                  if (content.type === 'text' && content.text) {
                    this.processTextResponse(content.text);
                  }
                }
              }
            }
          }
        }

        if (data.type === 'conversation.item.input_audio_transcription.completed') {
          this.conversationHistory += ' ' + data.transcript;
          this.processTranscript(data.transcript);
        }

        if (data.type === 'conversation.item.input_audio_transcription.delta') {
          this.processTranscript(data.delta);
        }
      } catch (error) {
        console.error('Erro ao processar mensagem WebSocket:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('Erro no WebSocket:', error);
    };

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 24000
      }
    });

    this.audioContext = new AudioContext({ sampleRate: 24000 });
    this.source = this.audioContext.createMediaStreamSource(this.stream);
    this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (e) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = new Int16Array(inputData.length);

        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        const base64Audio = btoa(String.fromCharCode(...new Uint8Array(pcm16.buffer)));

        this.ws.send(JSON.stringify({
          type: 'input_audio_buffer.append',
          audio: base64Audio
        }));
      }
    };

    this.source.connect(this.processor);
    this.processor.connect(this.audioContext.destination);
  }

  private processTextResponse(text: string): void {
    try {
      const trimmedText = text.trim();

      let jsonMatch = trimmedText.match(/\{[^}]+\}/);
      if (jsonMatch) {
        const fields = JSON.parse(jsonMatch[0]);
        if (Object.keys(fields).length > 0 && this.onFieldsUpdate) {
          this.onFieldsUpdate(fields);
        }
      }
    } catch (error) {
      console.error('Erro ao processar resposta:', error, text);
    }
  }

  private processTranscript(transcript: string): void {
    if (!transcript || !this.onFieldsUpdate) return;

    try {
      const fields: HeroFormData = {};
      const text = transcript.toLowerCase();

      const nameMatch = text.match(/nome\s+(?:é\s+)?([a-záàâãéèêíïóôõöúçñ\s]+?)(?:\s+(?:descrição|ideia|local|ano|observação|$))/i);
      if (nameMatch) {
        fields.name = nameMatch[1].trim();
      }

      const ideaMatch = text.match(/(?:descrição|ideia)\s+(?:é\s+)?([^.]+?)(?:\s+(?:nome|local|ano|observação|$))/i);
      if (ideaMatch) {
        fields.ideia = ideaMatch[1].trim();
      }

      const localMatch = text.match(/local\s+(?:é\s+)?([a-záàâãéèêíïóôõöúçñ\s]+?)(?:\s+(?:nome|descrição|ideia|ano|observação|$))/i);
      if (localMatch) {
        fields.local = localMatch[1].trim();
      }

      const yearMatch = text.match(/ano\s+(?:é\s+)?(\d{4})/i);
      if (yearMatch) {
        fields.ano = yearMatch[1];
      }

      const obsMatch = text.match(/observação\s+(?:é\s+)?([^.]+?)(?:\s+(?:nome|descrição|ideia|local|ano|$))/i);
      if (obsMatch) {
        fields.observacao = obsMatch[1].trim();
      }

      if (Object.keys(fields).length > 0) {
        this.onFieldsUpdate(fields);
      }
    } catch (error) {
      console.error('Erro ao processar transcrição:', error);
    }
  }

  stopRecording(): void {
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }

    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.conversationHistory = '';
  }

  isRecording(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
