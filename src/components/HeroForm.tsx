import { useState } from 'react';
import { X, User, MapPin, Calendar, FileText, Palette, Copy, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Hero = Database['public']['Tables']['heroes']['Row'];

const WEBHOOK_URL = 'https://n8n01.nevico.com.br/webhook/f2919f1d-acef-4741-ab00-b537cfcbdcc7';

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
    observacao: hero?.observacao || '',
    local: hero?.local || '',
    ano: hero?.ano || '',
    status: hero?.status || 'Pouco lembrado nacionalmente',
    artstyle: hero?.artstyle || 'Historical semi-realistic digital painting',
    storylength: hero?.storylength || '20',
    hero_image_url: hero?.hero_image_url || '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showWebhookPayload, setShowWebhookPayload] = useState(false);

  const getWebhookPayload = () => {
    return {
      name: formData.name,
      ideia: formData.ideia,
      observacao: formData.observacao,
      local: formData.local,
      ano: formData.ano,
      status: formData.status,
      artstyle: formData.artstyle,
      storylength: formData.storylength,
    };
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('JSON copiado para a área de transferência!');
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  const processWebhook = async (heroId: string, heroName: string) => {
    try {
      const webhookPayload = {
        heroId: heroId,
        name: formData.name,
        ideia: formData.ideia,
        observacao: formData.observacao,
        local: formData.local,
        ano: formData.ano,
        status: formData.status,
        artstyle: formData.artstyle,
        storylength: formData.storylength,
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
        console.log('Resposta do webhook:', webhookData);
      } catch (jsonError) {
        console.log('Resposta não é JSON, mas webhook retornou sucesso');
        webhookData = {};
      }

      const returnedFileUrl = webhookData.fileUrl || webhookData.file_url || webhookData.url ||
                              webhookData.fileurl || webhookData.file_Url || webhookData.downloadUrl ||
                              webhookData.download_url || webhookData.link;

      const updateData: any = {
        processing_status: 'completed'
      };

      if (returnedFileUrl) {
        console.log('URL do arquivo recebida:', returnedFileUrl);
        updateData.file_url = returnedFileUrl;
      } else {
        console.log('Webhook respondeu com sucesso, mas sem URL do arquivo');
      }

      const { error: updateError } = await supabase
        .from('heroes')
        .update(updateData)
        .eq('id', heroId);

      if (updateError) {
        console.error('Erro ao atualizar herói:', updateError);
      } else {
        console.log('Herói atualizado com sucesso!');
        if (onProcessingComplete && returnedFileUrl) {
          onProcessingComplete(returnedFileUrl, heroName);
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
        observacao: formData.observacao,
        local: formData.local,
        ano: formData.ano,
        status: formData.status,
        artstyle: formData.artstyle,
        storylength: formData.storylength,
        hero_image_url: formData.hero_image_url,
        alias: formData.name,
        powers: [],
        level: 1,
        processing_status: 'processing',
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
            {hero ? 'Editar Herói' : 'Registrar Novo Herói'}
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

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <User size={18} />
              Nome do Herói
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
              Descrição do Ato Heroico
            </label>
            <textarea
              required
              value={formData.ideia}
              onChange={(e) => setFormData({ ...formData, ideia: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              placeholder="Descreva o que tornou essa pessoa um herói..."
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <FileText size={18} />
              Observações (opcional)
            </label>
            <textarea
              value={formData.observacao}
              onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              placeholder="Informações adicionais..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <MapPin size={18} />
                Local
              </label>
              <input
                type="text"
                required
                value={formData.local}
                onChange={(e) => setFormData({ ...formData, local: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Ex: Janaúba - MG"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Calendar size={18} />
                Ano
              </label>
              <input
                type="text"
                required
                value={formData.ano}
                onChange={(e) => setFormData({ ...formData, ano: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Ex: 2017"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Status de Reconhecimento
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="Lembrado nacionalmente">Lembrado nacionalmente</option>
              <option value="Pouco lembrado nacionalmente">Pouco lembrado nacionalmente</option>
              <option value="Esquecido">Esquecido</option>
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Palette size={18} />
              Estilo Artístico
            </label>
            <input
              type="text"
              value={formData.artstyle}
              onChange={(e) => setFormData({ ...formData, artstyle: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Ex: Historical semi-realistic digital painting"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <FileText size={18} />
              Tamanho da História
            </label>
            <input
              type="text"
              value={formData.storylength}
              onChange={(e) => setFormData({ ...formData, storylength: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Ex: 20"
            />
            <p className="text-xs text-gray-500 mt-1">Número aproximado de páginas ou duração</p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => setShowWebhookPayload(true)}
              className="flex-1 px-6 py-3 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors font-medium"
            >
              Ver Requisição
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Salvando...' : hero ? 'Atualizar Herói' : 'Registrar Herói'}
            </button>
          </div>
        </form>
      </div>

      {showWebhookPayload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">Requisição para o Webhook</h3>
              <button
                onClick={() => setShowWebhookPayload(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">URL do Webhook</label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <code className="text-sm text-gray-800 break-all">{WEBHOOK_URL}</code>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-semibold text-gray-700">Corpo da Requisição (JSON)</label>
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(getWebhookPayload(), null, 2))}
                    className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    <Copy size={16} />
                    Copiar JSON
                  </button>
                </div>
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm text-green-400 font-mono">
{JSON.stringify(getWebhookPayload(), null, 2)}
                  </pre>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Método:</strong> POST<br />
                  <strong>Headers:</strong> Content-Type: application/json<br />
                  <strong>Ação:</strong> Esta requisição será enviada automaticamente quando você registrar ou atualizar o herói.
                </p>
              </div>

              <button
                onClick={() => setShowWebhookPayload(false)}
                className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
