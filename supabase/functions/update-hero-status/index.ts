import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const body = await req.json();
    const { heroId, fileUrl, status, content, generatedContent, generated_content, story, text, output, result } = body;

    console.log('Recebido callback do N8N:', body);

    if (!heroId) {
      return new Response(
        JSON.stringify({ error: 'heroId é obrigatório' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const updateData: any = {
      processing_status: status || 'completed',
    };

    if (fileUrl) {
      updateData.file_url = fileUrl;
    }

    const generatedText = content || generatedContent || generated_content || story || text || output || result;
    if (generatedText) {
      updateData.generated_content = generatedText;
      console.log('Conteúdo gerado recebido:', generatedText.substring(0, 100) + '...');
    }

    const { error } = await supabase
      .from('heroes')
      .update(updateData)
      .eq('id', heroId);

    if (error) {
      console.error('Erro ao atualizar herói:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    console.log('Herói atualizado com sucesso!');

    return new Response(
      JSON.stringify({ success: true, heroId, fileUrl }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (err) {
    console.error('Erro:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
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