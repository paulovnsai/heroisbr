import { Mic, Loader, CheckCircle, X } from 'lucide-react';

interface VoiceProcessingScreenProps {
  status: 'recording' | 'processing' | 'success' | 'error';
  onClose: () => void;
  errorMessage?: string;
}

export function VoiceProcessingScreen({ status, onClose, errorMessage }: VoiceProcessingScreenProps) {
  const getContent = () => {
    switch (status) {
      case 'recording':
        return {
          icon: <Mic size={64} className="text-red-500 animate-pulse" />,
          title: 'Gravando...',
          message: 'Fale os campos do herói. Clique no botão abaixo para parar.',
          bgColor: 'bg-gradient-to-br from-red-50 to-red-100',
        };
      case 'processing':
        return {
          icon: <Loader size={64} className="text-blue-500 animate-spin" />,
          title: 'Processando áudio...',
          message: 'Transcrevendo e extraindo informações. Aguarde um momento.',
          bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100',
        };
      case 'success':
        return {
          icon: <CheckCircle size={64} className="text-green-500" />,
          title: 'Sucesso!',
          message: 'Campos preenchidos com sucesso. Clique em "Continuar" para revisar.',
          bgColor: 'bg-gradient-to-br from-green-50 to-green-100',
        };
      case 'error':
        return {
          icon: <X size={64} className="text-red-500" />,
          title: 'Erro',
          message: errorMessage || 'Ocorreu um erro ao processar o áudio.',
          bgColor: 'bg-gradient-to-br from-red-50 to-red-100',
        };
    }
  };

  const content = getContent();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-[60]">
      <div className={`${content.bgColor} rounded-2xl max-w-md w-full p-8 shadow-2xl`}>
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="p-6 bg-white rounded-full shadow-lg">
            {content.icon}
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-gray-800">{content.title}</h2>
            <p className="text-gray-700 text-lg">{content.message}</p>
          </div>

          {(status === 'success' || status === 'error') && (
            <button
              onClick={onClose}
              className="w-full px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-all shadow-md hover:shadow-lg font-semibold text-lg"
            >
              {status === 'success' ? 'Continuar' : 'Fechar'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
