import { useEffect, useState, useRef } from 'react';
import { Loader, CheckCircle, X, Download, ArrowLeft, Copy, Check } from 'lucide-react';
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
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const hasProcessedRef = useRef(false);

  useEffect(() => {
    if (status !== 'processing') return;

    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [status]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (hasProcessedRef.current) {
      console.log('Webhook ja foi processado, pulando...');
      return;
    }

    hasProcessedRef.current = true;
    let isCancelled = false;

    const processWebhook = async () => {
      try {
        console.log('Enviando requisicao para o webhook...');

        const webhookPayload = {
          heroId: heroId,
          name: heroData.name,
          ideia: heroData.ideia,
          observacao: heroData.observacao,
          local: heroData.local,
          ano: heroData.ano,
          status: heroData.status,
          artstyle: heroData.artstyle,
          storylength: heroData.storylength,
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

        console.log('Status da resposta:', webhookResponse.status);

        if (!webhookResponse.ok) {
          const errorText = await webhookResponse.text();
          console.error('Erro do webhook:', errorText);
          throw new Error(`Erro ao processar no webhook: ${webhookResponse.status}`);
        }

        let webhookData;
        try {
          webhookData = await webhookResponse.json();
          console.log('Resposta do webhook:', webhookData);
        } catch (jsonError) {
          console.log('Resposta não é JSON, mas webhook retornou sucesso');
          webhookData = {};
        }

        if (isCancelled) return;

        const returnedFileUrl = webhookData.fileUrlmp4 || webhookData.fileUrl || webhookData.file_url ||
                                webhookData.url || webhookData.fileurl || webhookData.file_Url ||
                                webhookData.downloadUrl || webhookData.download_url || webhookData.link;

        const content = webhookData.content || webhookData.story || webhookData.text ||
                       webhookData.generatedContent || webhookData.generated_content ||
                       webhookData.output || webhookData.result || '';

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
        } else {
          console.log('Webhook respondeu com sucesso, mas sem conteúdo');
        }

        await supabase
          .from('heroes')
          .update(updateData)
          .eq('id', heroId);

        if (!isCancelled) {
          if (returnedFileUrl) {
            setFileUrl(returnedFileUrl);
          }
          if (content) {
            setGeneratedContent(content);
          }
          setStatus('success');
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
  }, [heroId]);

  const handleCopy = async () => {
    if (generatedContent) {
      await navigator.clipboard.writeText(generatedContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (generatedContent) {
      const blob = new Blob([generatedContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${heroData.name.replace(/\s+/g, '_')}_historia.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className={`rounded-2xl ${generatedContent ? 'max-w-4xl' : 'max-w-md'} w-full p-8 shadow-2xl my-8 ${
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
              {status === 'processing' && (
                <span className="flex items-center gap-3 justify-center">
                  Processando
                  <span className="text-blue-600 font-mono">{formatTime(elapsedTime)}</span>
                </span>
              )}
              {status === 'success' && 'Concluído!'}
              {status === 'error' && 'Erro'}
            </h2>
            <p className="text-gray-700 text-lg">
              {status === 'processing' && 'Aguardando processamento do n8n. Isso pode levar alguns instantes...'}
              {status === 'success' && generatedContent && 'História gerada com sucesso!'}
              {status === 'success' && !generatedContent && fileUrl && 'Arquivo gerado com sucesso!'}
              {status === 'success' && !generatedContent && !fileUrl && 'Processamento concluído!'}
              {status === 'error' && (errorMessage || 'Ocorreu um erro ao processar.')}
            </p>
          </div>

          {status === 'success' && generatedContent && (
            <div className="w-full space-y-3">
              <div className="bg-white rounded-lg p-6 shadow-inner max-h-96 overflow-y-auto text-left">
                <pre className="whitespace-pre-wrap text-gray-800 font-sans text-base leading-relaxed">
                  {generatedContent}
                </pre>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleCopy}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg font-semibold"
                >
                  {copied ? <Check size={20} /> : <Copy size={20} />}
                  {copied ? 'Copiado!' : 'Copiar Texto'}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-md hover:shadow-lg font-semibold"
                >
                  <Download size={20} />
                  Baixar .txt
                </button>
              </div>
            </div>
          )}

          {status === 'success' && fileUrl && !generatedContent && (
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
