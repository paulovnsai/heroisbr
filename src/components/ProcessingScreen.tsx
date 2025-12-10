import { useEffect, useState } from 'react';
import { Loader, CheckCircle, X, Download, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ProcessingScreenProps {
  heroId: string;
  heroData: {
    name: string;
    ideia: string;
    observacao: string;
    local: string;
    ano: string;
    status: string;
    artstyle: string;
    storylength: string;
  };
  onBack: () => void;
}

const WEBHOOK_URL = 'https://n8n01.nevico.com.br/webhook/f2919f1d-acef-4741-ab00-b537cfcbdcc7';

export function ProcessingScreen({ heroId, heroData, onBack }: ProcessingScreenProps) {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [fileUrl, setFileUrl] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    let isCancelled = false;

    const processWebhook = async () => {
      try {
        console.log('Enviando requisicao para o webhook...');

        const webhookPayload = {
          name: heroData.name,
          ideia: heroData.ideia,
          observacao: heroData.observacao,
          local: heroData.local,
          ano: heroData.ano,
          status: heroData.status,
          artstyle: heroData.artstyle,
          storylength: heroData.storylength,
        };

        console.log('Payload:', webhookPayload);

        const webhookResponse = await fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookPayload),
        });

        console.log('Status da resposta:', webhookResponse.status);

        if (!webhookResponse.ok) {
          const errorText = await webhookResponse.text();
          console.error('Erro do webhook:', errorText);
          throw new Error(`Erro ao processar no webhook: ${webhookResponse.status}`);
        }

        const webhookData = await webhookResponse.json();
        console.log('Resposta do webhook:', webhookData);

        if (isCancelled) return;

        if (webhookData.fileUrl || webhookData.file_url || webhookData.url) {
          const returnedFileUrl = webhookData.fileUrl || webhookData.file_url || webhookData.url;
          console.log('URL do arquivo recebida:', returnedFileUrl);

          await supabase
            .from('heroes')
            .update({
              file_url: returnedFileUrl,
              processing_status: 'completed'
            })
            .eq('id', heroId);

          if (!isCancelled) {
            setFileUrl(returnedFileUrl);
            setStatus('success');
          }
        } else {
          console.error('Webhook nao retornou URL do arquivo');
          throw new Error('Webhook não retornou URL do arquivo');
        }
      } catch (err: any) {
        console.error('Erro ao processar:', err);

        if (isCancelled) return;

        setErrorMessage(err.message || 'Ocorreu um erro ao processar');
        setStatus('error');

        await supabase
          .from('heroes')
          .update({
            processing_status: 'error'
          })
          .eq('id', heroId);
      }
    };

    processWebhook();

    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4 z-50">
      <div className={`rounded-2xl max-w-md w-full p-8 shadow-2xl ${
        status === 'processing' ? 'bg-gradient-to-br from-blue-50 to-blue-100' :
        status === 'success' ? 'bg-gradient-to-br from-green-50 to-green-100' :
        'bg-gradient-to-br from-red-50 to-red-100'
      }`}>
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="p-6 bg-white rounded-full shadow-lg">
            {status === 'processing' && (
              <Loader size={64} className="text-blue-500 animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle size={64} className="text-green-500" />
            )}
            {status === 'error' && (
              <X size={64} className="text-red-500" />
            )}
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-gray-800">
              {status === 'processing' && 'Processando...'}
              {status === 'success' && 'Concluído!'}
              {status === 'error' && 'Erro'}
            </h2>
            <p className="text-gray-700 text-lg">
              {status === 'processing' && 'Aguardando processamento do n8n. Isso pode levar alguns instantes...'}
              {status === 'success' && 'Arquivo gerado com sucesso! Clique no link abaixo para baixar.'}
              {status === 'error' && (errorMessage || 'Ocorreu um erro ao processar.')}
            </p>
          </div>

          {status === 'success' && fileUrl && (
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-md hover:shadow-lg font-semibold text-lg"
            >
              <Download size={20} />
              Baixar Arquivo
            </a>
          )}

          {(status === 'success' || status === 'error') && (
            <button
              onClick={onBack}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-all shadow-md hover:shadow-lg font-semibold text-lg"
            >
              <ArrowLeft size={20} />
              {status === 'success' ? 'Voltar para Lista' : 'Tentar Novamente'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
