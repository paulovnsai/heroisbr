import { useState, useRef } from 'react';
import { X, User, MapPin, Calendar, FileText, Image as ImageIcon, Palette, Upload, Copy } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { SmartVoiceButton } from './SmartVoiceButton';

type Hero = Database['public']['Tables']['heroes']['Row'];

interface HeroFormProps {
  hero?: Hero;
  onClose: () => void;
  onSuccess: () => void;
}

const WEBHOOK_URL = 'https://n8n01.nevico.com.br/webhook/f2919f1d-acef-4741-ab00-b537cfcbdcc7';

export function HeroForm({ hero, onClose, onSuccess }: HeroFormProps) {
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
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState(hero?.hero_image_url || '');
  const [showWebhookPayload, setShowWebhookPayload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleVoiceFieldsExtracted = (fields: Record<string, string>) => {
    setFormData(prev => ({
      ...prev,
      ...fields,
    }));
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { data, error } = await supabase.storage
      .from('hero-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('hero-images')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione apenas arquivos de imagem');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const url = await uploadImage(file);
      setImagePreview(url);
      setFormData({ ...formData, hero_image_url: url });
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer upload da imagem');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) {
          await handleImageUpload(file);
        }
        break;
      }
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      await handleImageUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

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

      const webhookPayload = {
        name: formData.name,
        ideia: formData.ideia,
        observacao: formData.observacao,
        local: formData.local,
        ano: formData.ano,
        status: formData.status,
        artstyle: formData.artstyle,
        storylength: formData.storylength,
      };

      const webhookResponse = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload),
      });

      if (!webhookResponse.ok) {
        throw new Error('Erro ao processar no webhook');
      }

      const webhookData = await webhookResponse.json();

      if (webhookData.fileUrl || webhookData.file_url || webhookData.url) {
        const fileUrl = webhookData.fileUrl || webhookData.file_url || webhookData.url;

        await supabase
          .from('heroes')
          .update({
            file_url: fileUrl,
            processing_status: 'completed'
          })
          .eq('id', heroId);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao salvar');
    } finally {
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

          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-green-800 mb-1">Preencher por Voz</h3>
                  <p className="text-sm text-green-700">
                    Fale os campos e conteúdos. Ex: "nome João Silva, descrição salvou crianças, local São Paulo, ano 2020"
                  </p>
                </div>
                <SmartVoiceButton onFieldsExtracted={handleVoiceFieldsExtracted} />
              </div>
            </div>
          </div>

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
              <ImageIcon size={18} />
              Imagem do Herói
            </label>
            <div className="space-y-3">
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onPaste={handlePaste}
                className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-green-500 transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {imagePreview ? (
                  <div className="space-y-3">
                    <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview('');
                        setFormData({ ...formData, hero_image_url: '' });
                      }}
                      className="w-full px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm"
                    >
                      Remover Imagem
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    {uploading ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                        <p className="text-sm text-gray-600">Fazendo upload...</p>
                      </div>
                    ) : (
                      <>
                        <Upload size={32} className="mx-auto text-gray-400 mb-3" />
                        <p className="text-sm text-gray-600 mb-2">
                          Arraste uma imagem aqui ou
                        </p>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                          Selecionar Arquivo
                        </button>
                        <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-500">
                          <Copy size={14} />
                          <span>Você também pode colar (Ctrl+V) uma imagem aqui</span>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-500">
                Formatos suportados: PNG, JPG, GIF, WEBP
              </p>
            </div>
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
              <ImageIcon size={18} />
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
