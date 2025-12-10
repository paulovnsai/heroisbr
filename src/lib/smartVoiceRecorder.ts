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
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private audioChunks: Blob[] = [];
  private onFieldsUpdate?: (fields: HeroFormData) => void;

  async startRecording(onFieldsUpdate?: (fields: HeroFormData) => void): Promise<void> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Seu navegador não suporta gravação de áudio ou a página precisa estar em HTTPS');
    }

    this.onFieldsUpdate = onFieldsUpdate;
    this.audioChunks = [];

    console.log('Solicitando permissão do microfone...');
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: true
    });
    console.log('Permissão do microfone concedida!');

    this.mediaRecorder = new MediaRecorder(this.stream);

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    this.mediaRecorder.onstop = async () => {
      console.log('Gravação finalizada, processando...');
      await this.processAudio();
    };

    this.mediaRecorder.start();
    console.log('Gravação iniciada!');
  }

  private async processAudio(): Promise<void> {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('Chave da API OpenAI não configurada');
    }

    try {
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
      console.log('Áudio capturado:', audioBlob.size, 'bytes');

      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', 'whisper-1');
      formData.append('language', 'pt');

      console.log('Enviando para Whisper...');
      const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        body: formData
      });

      if (!transcriptionResponse.ok) {
        throw new Error(`Erro na transcrição: ${transcriptionResponse.statusText}`);
      }

      const transcriptionData = await transcriptionResponse.json();
      const transcript = transcriptionData.text;
      console.log('Transcrição:', transcript);

      console.log('Extraindo campos com GPT...');
      const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `Você extrai informações de heróis brasileiros de uma transcrição de áudio.

Campos possíveis:
- name: nome do herói
- ideia: descrição do ato heroico
- observacao: observações adicionais
- local: cidade/estado onde ocorreu
- ano: ano do acontecimento
- artstyle: estilo artístico (se mencionado)
- storylength: tamanho da história (se mencionado)

Retorne APENAS um JSON com os campos identificados. Não adicione explicações.`
            },
            {
              role: 'user',
              content: transcript
            }
          ],
          temperature: 0.3
        })
      });

      if (!gptResponse.ok) {
        throw new Error(`Erro no GPT: ${gptResponse.statusText}`);
      }

      const gptData = await gptResponse.json();
      const content = gptData.choices[0].message.content;
      console.log('Resposta GPT:', content);

      const jsonMatch = content.match(/\{[^}]+\}/);
      if (jsonMatch) {
        const fields = JSON.parse(jsonMatch[0]);
        console.log('Campos extraídos:', fields);
        if (Object.keys(fields).length > 0 && this.onFieldsUpdate) {
          this.onFieldsUpdate(fields);
        }
      }
    } catch (error) {
      console.error('Erro ao processar áudio:', error);
      throw error;
    }
  }

  stopRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }
}
