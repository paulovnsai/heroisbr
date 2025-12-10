import { useState } from 'react';
import { X, User, FileText, Palette, Code } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { AudioRecorder } from './AudioRecorder';

type Hero = Database['public']['Tables']['heroes']['Row'];

const WEBHOOK_URL = 'https://n8n01.nevico.com.br/webhook/f2919f1d-acef-4741-ab00-b537cfcbdcc7';

const ART_STYLES = [
  {
    id: 'exemplo_01',
    name: 'Historical Semi-Realistic',
    image: '/exemplo_01.jpg',
    prompt: 'Historical semi-realistic digital painting'
  },
  {
    id: 'exemplo_02',
    name: '3D Animation (Pixar)',
    image: '/exemplo_02.jpg',
    prompt: 'ultra-cute 3D animation style, soft lighting, pastel color palette, cinematic bokeh, smooth fluffy textures, expressive eyes, storybook atmosphere, Pixar-quality'
  },
  {
    id: 'exemplo_03',
    name: 'Cinematic Minimalism',
    image: '/exemplo_03.jpg',
    prompt: 'Cinematic painterly minimalism, simplified facial features, warm diffused lighting, smooth brushwork, minimal background noise, emotional focus on characters, natural color palette, subtle contour lines, modern documentary illustration style'
  },
  {
    id: 'exemplo_04',
    name: 'Art Nouveau',
    image: '/exemplo_04.jpg',
    prompt: 'Vintage Art Nouveau illustrative style, delicate ink linework, soft digital watercolor textures, pastel Mediterranean palette, elegant feminine poses, Belle Époque aesthetics, minimal shading, warm paper-like background, romantic poetic atmosphere'
  },
  {
    id: 'exemplo_05',
    name: 'Retro Pixel Art',
    image: '/exemplo_05.jpg',
    prompt: 'Art Style: Retro Pixel Art (8-bit / 16-bit)'
  },
  {
    id: 'exemplo_06',
    name: 'Flat 2D Vector',
    image: '/exemplo_06.jpg',
    prompt: 'flat 2d vector illustration, infographic motion-design aesthetic, bold clean outlines, simplified geometric shapes, bright saturated colors, expressive cartoon faces, minimal shading, high-contrast background, dynamic composition, educational visual tone, smooth subtle gradients, clear readable forms, youtube-thumbnail-friendly layout'
  }
];

interface HeroFormProps {
  hero?: Hero;
  onClose: () => void;
  onSuccess: () => void;
  onProcessingComplete?: (fileUrl: string, heroName: string) => void;
}

export function HeroForm({ hero, onClose, onSuccess, onProcessingComplete }: HeroFormProps) {
  const [formData, setFormData] = useState({
    name: hero?.name || '',
    ideia: hero?.ideia || '',
    storylength: hero?.storylength || '1 minuto',
    artStyle: hero?.art_style || ART_STYLES[0].prompt,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPayload, setShowPayload] = useState(false);

  const handleTranscriptionComplete = (data: any) => {
    setFormData((prev) => ({
      ...prev,
      ...(data.name && { name: data.name }),
      ...(data.ideia && { ideia: data.ideia }),
    }));
  };


  const uploadImageFromUrl = async (imageUrl: string, heroId: string): Promise<string | null> => {
    try {
      console.log('Baixando imagem da URL:', imageUrl);

      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        console.error('Erro ao baixar imagem:', imageResponse.status);
        return null;
      }

      const blob = await imageResponse.blob();
      const fileExt = imageUrl.split('.').pop()?.split('?')[0] || 'png';
      const fileName = `${heroId}-${Date.now()}.${fileExt}`;

      console.log('Fazendo upload da imagem para Supabase:', fileName);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('hero-images')
        .upload(fileName, blob, {
          contentType: blob.type,
          upsert: true
        });

      if (uploadError) {
        console.error('Erro ao fazer upload:', uploadError);
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('hero-images')
        .getPublicUrl(fileName);

      console.log('Imagem carregada com sucesso:', publicUrl);
      return publicUrl;
    } catch (err) {
      console.error('Erro ao processar imagem:', err);
      return null;
    }
  };

  const extractStoryLengthNumber = (storylength: string): number => {
    const match = storylength.match(/\d+/);
    return match ? parseInt(match[0]) : 1;
  };

  const processWebhook = async (heroId: string, heroName: string) => {
    try {
      const webhookPayload = {
        heroId: heroId,
        name: formData.name,
        ideia: formData.ideia,
        storylength: extractStoryLengthNumber(formData.storylength),
        artStyle: formData.artStyle,
      };

      console.log('Enviando para webhook com heroId:', heroId);
      console.log('Payload:', webhookPayload);

      const webhookResponse = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload),
      });

      console.log('Status da resposta do webhook:', webhookResponse.status);

      if (!webhookResponse.ok) {
        const errorText = await webhookResponse.text();
        console.error('Erro do webhook:', errorText);

        await supabase
          .from('heroes')
          .update({ processing_status: 'error' })
          .eq('id', heroId);

        return;
      }

      let webhookData;
      try {
        webhookData = await webhookResponse.json();
        console.log('====== RESPOSTA DO WEBHOOK ======');
        console.log('JSON COMPLETO:', JSON.stringify(webhookData, null, 2));
        console.log('Todas as chaves:', Object.keys(webhookData));
        console.log('Valores:', Object.values(webhookData));
        console.log('================================');
      } catch (jsonError) {
        console.log('Resposta não é JSON, mas webhook retornou sucesso');
        webhookData = {};
      }

      const returnedFileUrl = webhookData.fileUrlmp4 || webhookData.fileUrl || webhookData.file_url ||
                              webhookData.url || webhookData.fileurl || webhookData.file_Url ||
                              webhookData.downloadUrl || webhookData.download_url || webhookData.link;

      const content = webhookData.content || webhookData.story || webhookData.text ||
                     webhookData.generatedContent || webhookData.generated_content ||
                     webhookData.output || webhookData.result || '';

      const capaUrl = webhookData.fileUrlpng || webhookData.capa || webhookData.coverImage || webhookData.cover;

      console.log('✅ URL do arquivo:', returnedFileUrl || 'Não fornecida');
      console.log('✅ Conteúdo:', content ? content.substring(0, 50) + '...' : 'Não fornecido');
      console.log('✅ URL da capa:', capaUrl || 'Não fornecida');

      const updateData: any = {
        processing_status: 'completed'
      };

      if (returnedFileUrl) {
        console.log('URL do arquivo recebida:', returnedFileUrl);
        updateData.file_url = returnedFileUrl;
      }

      if (content) {
        console.log('Conteúdo recebido:', content.substring(0, 100) + '...');
        updateData.generated_content = content;
      }

      if (capaUrl) {
        console.log('Processando imagem de capa...');
        const uploadedImageUrl = await uploadImageFromUrl(capaUrl, heroId);
        if (uploadedImageUrl) {
          updateData.hero_image_url = uploadedImageUrl;
          console.log('Imagem de capa atualizada:', uploadedImageUrl);
        }
      }

      const { error: updateError } = await supabase
        .from('heroes')
        .update(updateData)
        .eq('id', heroId);

      if (updateError) {
        console.error('Erro ao atualizar registro:', updateError);
      } else {
        console.log('Registro atualizado com sucesso!');
        if (onProcessingComplete && (returnedFileUrl || content)) {
          onProcessingComplete(returnedFileUrl || content, heroName);
        } else if (onProcessingComplete) {
          onProcessingComplete('', heroName);
        }
      }
    } catch (err: any) {
      console.error('Erro ao processar webhook:', err);
      await supabase
        .from('heroes')
        .update({ processing_status: 'error' })
        .eq('id', heroId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const dataToInsert = {
        name: formData.name,
        ideia: formData.ideia,
        observacao: '',
        local: '',
        ano: '',
        status: 'Pouco lembrado nacionalmente',
        artstyle: 'Historical semi-realistic digital painting',
        storylength: formData.storylength,
        hero_image_url: '',
        alias: formData.name,
        powers: [],
        level: 1,
        processing_status: 'processing',
        art_style: formData.artStyle,
      };

      let heroId: string;
      const heroName = formData.name;

      if (hero) {
        heroId = hero.id;

        const { error: updateError } = await supabase
          .from('heroes')
          .update(dataToInsert)
          .eq('id', hero.id);

        if (updateError) throw updateError;
      } else {
        const { data, error: insertError } = await supabase
          .from('heroes')
          .insert([dataToInsert])
          .select()
          .single();

        if (insertError) throw insertError;
        heroId = data.id;
      }

      onSuccess();
      onClose();

      processWebhook(heroId, heroName);
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao salvar');
      console.error('Erro ao processar:', err);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">
            Criar
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <AudioRecorder
            onTranscriptionComplete={handleTranscriptionComplete}
            supabaseUrl={import.meta.env.VITE_SUPABASE_URL}
            openaiKey={import.meta.env.VITE_OPENAI_API_KEY}
          />

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <User size={18} />
              Nome do Vídeo
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Ex: Professora Heley de Abreu"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <FileText size={18} />
              Descrição
            </label>
            <textarea
              required
              value={formData.ideia}
              onChange={(e) => setFormData({ ...formData, ideia: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              placeholder="Descreva o conteúdo do vídeo..."
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Duração do Vídeo
            </label>
            <select
              value={formData.storylength}
              onChange={(e) => setFormData({ ...formData, storylength: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="30 segundos">30 segundos</option>
              <option value="1 minuto">1 minuto</option>
              <option value="2 minutos">2 minutos</option>
              <option value="3 minutos">3 minutos</option>
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
              <Palette size={18} />
              Estilo Visual
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {ART_STYLES.filter(style => style.id !== 'exemplo_06').map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, artStyle: style.prompt })}
                  className={`relative group overflow-hidden rounded-lg border-2 transition-all ${
                    formData.artStyle === style.prompt
                      ? 'border-green-500 ring-2 ring-green-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={style.image}
                      alt={style.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className={`absolute inset-0 flex items-end justify-center pb-2 transition-opacity ${
                    formData.artStyle === style.prompt
                      ? 'bg-gradient-to-t from-green-900/80 to-transparent'
                      : 'bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100'
                  }`}>
                    <span className="text-white text-xs font-medium px-2 text-center">
                      {style.name}
                    </span>
                  </div>
                  {formData.artStyle === style.prompt && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowPayload(!showPayload)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Code size={16} />
            {showPayload ? 'Ocultar' : 'Ver'} Payload N8N
          </button>

          {showPayload && (
            <div className="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-xs overflow-x-auto">
              <pre>{JSON.stringify({
                name: formData.name,
                ideia: formData.ideia,
                storylength: extractStoryLengthNumber(formData.storylength),
                artStyle: formData.artStyle,
              }, null, 2)}</pre>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Salvando...' : hero ? 'Atualizar' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
