import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openaiKey) {
      throw new Error('OPENAI_API_KEY não configurada');
    }

    const { audioData } = await req.json();

    if (!audioData) {
      throw new Error('audioData é obrigatório');
    }

    const audioBuffer = Uint8Array.from(atob(audioData), c => c.charCodeAt(0));
    const audioBlob = new Blob([audioBuffer], { type: 'audio/webm' });

    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'pt');

    const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: formData,
    });

    if (!transcriptionResponse.ok) {
      const error = await transcriptionResponse.text();
      throw new Error(`Erro na transcrição: ${error}`);
    }

    const transcription = await transcriptionResponse.json();
    const transcribedText = transcription.text;

    const extractionPrompt = `Você é um assistente que extrai informações de heróis brasileiros a partir de uma transcrição.

Transcrição: "${transcribedText}"

Extraia as seguintes informações se disponíveis:
- name: Nome completo do herói
- ideia: Descrição do ato heroico
- observacao: Observações adicionais
- local: Cidade e estado (formato: Cidade - UF)
- ano: Ano do acontecimento
- status: Um de: "Lembrado nacionalmente", "Pouco lembrado nacionalmente", "Esquecido"
- artstyle: Estilo artístico (padrão: "Historical semi-realistic digital painting")
- storylength: Duração da história (padrão: "1 minuto")

Retorne APENAS um JSON válido com os campos encontrados. Se um campo não for mencionado, use string vazia. Exemplo:
{
  "name": "Maria Silva",
  "ideia": "Salvou crianças de incêndio",
  "observacao": "",
  "local": "São Paulo - SP",
  "ano": "2020",
  "status": "Pouco lembrado nacionalmente",
  "artstyle": "Historical semi-realistic digital painting",
  "storylength": "1 minuto"
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
      const error = await gptResponse.text();
      throw new Error(`Erro ao extrair dados: ${error}`);
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

    return new Response(
      JSON.stringify({
        success: true,
        transcription: transcribedText,
        data: extractedData,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});