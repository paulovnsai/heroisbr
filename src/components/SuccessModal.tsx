import { X, Download, Copy } from 'lucide-react';

interface SuccessModalProps {
  fileUrl: string;
  heroName: string;
  onClose: () => void;
}

export function SuccessModal({ fileUrl, heroName, onClose }: SuccessModalProps) {
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Link copiado para a área de transferência!');
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full">
        <div className="bg-green-600 text-white px-6 py-4 flex justify-between items-center rounded-t-lg">
          <h2 className="text-2xl font-bold">Processamento Concluído!</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-8 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Download size={40} className="text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              Arquivo de {heroName} está pronto!
            </h3>
            <p className="text-gray-600">O webhook processou os dados e gerou o arquivo.</p>
          </div>

          <div className="mb-6">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600 mb-2">Link do arquivo gerado:</p>
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 break-all text-sm"
              >
                {fileUrl}
              </a>
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => copyToClipboard(fileUrl)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                <Copy size={20} />
                Copiar Link
              </button>
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <Download size={20} />
                Baixar Arquivo
              </a>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
