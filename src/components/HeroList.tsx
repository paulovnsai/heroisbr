import { useEffect, useState } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Eye, MapPin, Calendar, Download, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { HeroForm } from './HeroForm';
import { ProcessingScreen } from './ProcessingScreen';

type Hero = Database['public']['Tables']['heroes']['Row'];

export function HeroList() {
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [filteredHeroes, setFilteredHeroes] = useState<Hero[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [selectedHero, setSelectedHero] = useState<Hero | null>(null);
  const [viewingHero, setViewingHero] = useState<Hero | null>(null);
  const [processingHeroId, setProcessingHeroId] = useState<string | null>(null);
  const [processingHeroData, setProcessingHeroData] = useState<any>(null);

  useEffect(() => {
    fetchHeroes();
  }, []);

  useEffect(() => {
    filterHeroes();
  }, [heroes, searchTerm, statusFilter]);

  const fetchHeroes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('heroes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHeroes(data || []);
    } catch (error) {
      console.error('Erro ao buscar heróis:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterHeroes = () => {
    let filtered = heroes;

    if (searchTerm) {
      filtered = filtered.filter(
        (hero) =>
          hero.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          hero.local?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          hero.ideia?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((hero) => hero.status === statusFilter);
    }

    setFilteredHeroes(filtered);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este herói do registro?')) {
      return;
    }

    try {
      const { error } = await supabase.from('heroes').delete().eq('id', id);
      if (error) throw error;
      fetchHeroes();
    } catch (error) {
      console.error('Erro ao deletar herói:', error);
    }
  };

  const handleEdit = (hero: Hero) => {
    setSelectedHero(hero);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedHero(null);
  };

  const handleStartProcessing = (heroId: string, heroData: any) => {
    setShowForm(false);
    setSelectedHero(null);
    setProcessingHeroId(heroId);
    setProcessingHeroData(heroData);
  };

  const handleProcessingBack = () => {
    setProcessingHeroId(null);
    setProcessingHeroData(null);
    fetchHeroes();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Lembrado nacionalmente':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Pouco lembrado nacionalmente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Esquecido':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getProcessingStatusBadge = (status: string | null) => {
    switch (status) {
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
            <Loader size={12} className="animate-spin" />
            Processando
          </span>
        );
      case 'completed':
        return (
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
            Concluído
          </span>
        );
      case 'error':
        return (
          <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
            Erro
          </span>
        );
      default:
        return (
          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
            Pendente
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Registro de Heróis</h1>
          <p className="text-gray-600 mt-1">Gerencie e honre os heróis brasileiros</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl"
        >
          <Plus size={20} />
          Registrar Herói
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nome, local ou história..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none"
            >
              <option value="all">Todos os Status</option>
              <option value="Lembrado nacionalmente">Lembrado nacionalmente</option>
              <option value="Pouco lembrado nacionalmente">Pouco lembrado nacionalmente</option>
              <option value="Esquecido">Esquecido</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHeroes.map((hero) => (
            <div
              key={hero.id}
              className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow border border-gray-200"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={hero.hero_image_url || "https://images.pexels.com/photos/2962135/pexels-photo-2962135.jpeg?auto=compress&cs=tinysrgb&w=800"}
                  alt={hero.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                <div className="absolute top-3 right-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(hero.status)}`}>
                    {hero.status}
                  </span>
                </div>
                <div className="absolute bottom-3 left-3 bg-black bg-opacity-60 text-white px-3 py-1 rounded-full text-sm font-medium">
                  {hero.ano}
                </div>
              </div>

              <div className="p-5">
                <h3 className="text-xl font-bold text-gray-800 mb-1">{hero.name}</h3>

                {hero.local && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                    <MapPin size={16} />
                    <span>{hero.local}</span>
                  </div>
                )}

                <p className="text-sm text-gray-700 mb-3 line-clamp-3">
                  {hero.ideia}
                </p>

                <div className="mb-3">
                  {getProcessingStatusBadge(hero.processing_status)}
                </div>

                {hero.file_url && (
                  <a
                    href={hero.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm mb-3"
                  >
                    <Download size={16} />
                    Baixar Arquivo
                  </a>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => setViewingHero(hero)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    <Eye size={16} />
                    Ver
                  </button>
                  <button
                    onClick={() => handleEdit(hero)}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(hero.id)}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredHeroes.length === 0 && (
          <div className="text-center py-12">
            <MapPin size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg">Nenhum herói encontrado</p>
            <p className="text-gray-500 text-sm mt-2">Tente ajustar sua busca ou filtros</p>
          </div>
        )}
      </div>

      {showForm && (
        <HeroForm
          hero={selectedHero || undefined}
          onClose={handleFormClose}
          onSuccess={fetchHeroes}
          onStartProcessing={handleStartProcessing}
        />
      )}

      {processingHeroId && processingHeroData && (
        <ProcessingScreen
          heroId={processingHeroId}
          heroData={processingHeroData}
          onBack={handleProcessingBack}
        />
      )}

      {viewingHero && (
        <HeroDetails hero={viewingHero} onClose={() => setViewingHero(null)} />
      )}
    </div>
  );
}

interface HeroDetailsProps {
  hero: Hero;
  onClose: () => void;
}

function HeroDetails({ hero, onClose }: HeroDetailsProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Lembrado nacionalmente':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Pouco lembrado nacionalmente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Esquecido':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="relative h-64 overflow-hidden">
          <img
            src={hero.hero_image_url || "https://images.pexels.com/photos/2962135/pexels-photo-2962135.jpeg?auto=compress&cs=tinysrgb&w=1200"}
            alt={hero.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-6 left-6 text-white">
            <p className="text-3xl font-bold">{hero.ano}</p>
            <p className="text-lg mt-1">{hero.local}</p>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 rounded-full p-2 transition-all"
          >
            <Eye size={20} />
          </button>
        </div>

        <div className="p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-4xl font-bold text-gray-800 mb-2">{hero.name}</h2>
              {hero.local && (
                <div className="flex items-center gap-2 text-xl text-gray-600">
                  <MapPin size={24} />
                  <span>{hero.local}</span>
                </div>
              )}
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(hero.status)}`}>
              {hero.status}
            </span>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Ato Heroico</h3>
            <p className="text-gray-700 leading-relaxed text-lg">{hero.ideia}</p>
          </div>

          {hero.observacao && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Observações</h3>
              <p className="text-gray-700 leading-relaxed">{hero.observacao}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Ano do Acontecimento</h3>
              <div className="flex items-center gap-2 text-xl text-gray-800">
                <Calendar size={24} />
                <span className="font-semibold">{hero.ano}</span>
              </div>
            </div>

            {hero.local && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Local</h3>
                <div className="flex items-center gap-2 text-xl text-gray-800">
                  <MapPin size={24} />
                  <span className="font-semibold">{hero.local}</span>
                </div>
              </div>
            )}
          </div>

          {hero.artstyle && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Estilo Artístico</h3>
              <p className="text-gray-700">{hero.artstyle}</p>
            </div>
          )}

          {hero.file_url && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Arquivo Gerado</h3>
              <a
                href={hero.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download size={20} />
                Baixar Arquivo
              </a>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200 text-sm text-gray-500">
            <p>Registrado em: {new Date(hero.created_at).toLocaleDateString('pt-BR')}</p>
            <p>Última atualização: {new Date(hero.updated_at).toLocaleDateString('pt-BR')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
