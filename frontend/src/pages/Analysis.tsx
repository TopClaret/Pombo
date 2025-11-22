import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Search, Filter, Download, Eye } from 'lucide-react';
import { toast } from 'react-toastify';
import { analysisAPI, uploadAPI } from '../services/api';

const AnalysisContainer = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 30px;
`;

const FiltersSection = styled.div`
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
`;

const FiltersTitle = styled.h2`
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const FiltersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-weight: 500;
  color: #555;
  font-size: 0.9rem;
`;

const Select = styled.select`
  padding: 8px 12px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: #1976d2;
  }
`;

const SearchInput = styled.input`
  padding: 8px 12px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: #1976d2;
  }
`;

const ActionsRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
`;

const ActionButton = styled.button`
  background: #1976d2;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  
  &:hover {
    background: #1565c0;
  }
`;

const ResultsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
`;

const AnalysisCard = styled.div`
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const FileName = styled.h3`
  font-weight: 600;
  color: #333;
  margin: 0;
`;

const FileType = styled.span`
  background: #e3f2fd;
  color: #1976d2;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
`;

const AnalysisResults = styled.div`
  margin-top: 12px;
`;

const ResultItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
  
  &:last-child {
    border-bottom: none;
  }
`;

const ResultLabel = styled.span`
  font-weight: 500;
  color: #555;
`;

const ResultValue = styled.span<{ confidence?: number }>`
  font-weight: 600;
  color: ${props => {
    if (props.confidence !== undefined) {
      if (props.confidence > 0.8) return '#2e7d32';
      if (props.confidence > 0.5) return '#f57c00';
      return '#d32f2f';
    }
    return '#1976d2';
  }};
`;

const CardActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 16px;
`;

const SmallButton = styled.button`
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  
  &:hover {
    background: #e0e0e0;
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 40px;
  color: #666;
`;

const EmptyMessage = styled.div`
  text-align: center;
  padding: 40px;
  color: #666;
`;

interface Analysis {
  id: string;
  fileName: string;
  fileType: string;
  status: 'completed' | 'processing' | 'failed';
  analysisResults: {
    licensePlates?: Array<{ plate: string; confidence: number }>;
    persons?: Array<{ count: number; confidence: number }>;
    objects?: Array<{ name: string; confidence: number }>;
    text?: Array<{ text: string; confidence: number }>;
    colors?: Array<{ color: string; percentage: number }>;
  };
  createdAt: string;
  processingTime?: number;
}

const Analysis: React.FC = () => {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    fileType: '',
    search: ''
  });

  const navigate = useNavigate();

  useEffect(() => {
    loadAnalyses();
  }, []);

  const loadAnalyses = async () => {
    try {
      setLoading(true);
      const response = await uploadAPI.getUserUploads();
      // Mapear os uploads para o formato esperado pela interface Analysis
      const fetchedAnalyses: Analysis[] = response.data.data.uploads.map((upload: any) => ({
        id: upload.id,
        fileName: upload.originalName,
        fileType: upload.fileType,
        status: upload.status,
        analysisResults: upload.analysisResults || {}, // Garante que analysisResults não seja undefined
        createdAt: upload.createdAt,
        processingTime: upload.processingTime,
      }));
      setAnalyses(fetchedAnalyses);
    } catch (error) {
      console.error('Erro ao carregar análises:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAnalyses = analyses.filter(analysis => {
    return (
      (filters.status === '' || analysis.status === filters.status) &&
      (filters.fileType === '' || analysis.fileType.includes(filters.fileType)) &&
      (filters.search === '' || analysis.fileName.toLowerCase().includes(filters.search.toLowerCase()))
    );
  });

  const handleExport = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(filteredAnalyses, null, 2)
    )}`;
    const link = document.createElement('a');
    link.href = jsonString;
    link.download = 'analises_exportadas.json';
    link.click();
    toast.success('Análises exportadas com sucesso!');
  };

  const handleViewDetails = (analysisId: string) => {
    navigate(`/analysis/${analysisId}`);
  };

  const handleExportSingle = (analysis: Analysis) => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(analysis, null, 2)
    )}`;
    const link = document.createElement('a');
    link.href = jsonString;
    link.download = `${analysis.fileName.split('.')[0]}_analise.json`;
    link.click();
    toast.success(`Análise de ${analysis.fileName} exportada com sucesso!`);
  };


  return (
    <AnalysisContainer>
      <Title>Análises</Title>
      
      <FiltersSection>
        <FiltersTitle>
          <Filter size={20} />
          Filtros
        </FiltersTitle>
        
        <FiltersGrid>
          <FilterGroup>
            <Label>Status</Label>
            <Select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">Todos</option>
              <option value="completed">Concluído</option>
              <option value="processing">Processando</option>
              <option value="failed">Falha</option>
            </Select>
          </FilterGroup>
          
          <FilterGroup>
            <Label>Tipo de Arquivo</Label>
            <Select
              value={filters.fileType}
              onChange={(e) => setFilters({ ...filters, fileType: e.target.value })}
            >
              <option value="">Todos</option>
              <option value="image">Imagem</option>
              <option value="video">Vídeo</option>
            </Select>
          </FilterGroup>
          
          <FilterGroup>
            <Label>Pesquisar</Label>
            <SearchInput
              type="text"
              placeholder="Nome do arquivo..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </FilterGroup>
        </FiltersGrid>
        
        <ActionsRow>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Search size={20} color="#666" />
            <span>{filteredAnalyses.length} resultados encontrados</span>
          </div>
          
          <ActionButton onClick={handleExport}>
            <Download size={16} />
            Exportar Dados
          </ActionButton>
        </ActionsRow>
      </FiltersSection>

      {filteredAnalyses.length === 0 ? (
        <EmptyMessage>
          Nenhuma análise encontrada com os filtros selecionados.
        </EmptyMessage>
      ) : (
        <ResultsGrid>
          {filteredAnalyses.map((analysis) => (
            <AnalysisCard key={analysis.id}>
              <CardHeader>
                <FileName>{analysis.fileName}</FileName>
                <FileType>
                  {analysis.fileType.includes('image') ? 'Imagem' : 'Vídeo'}
                </FileType>
              </CardHeader>
              
              <AnalysisResults>
                {analysis.analysisResults.licensePlates && (
                  <ResultItem>
                    <ResultLabel>Placas:</ResultLabel>
                    <div>
                      {analysis.analysisResults.licensePlates.map((plate, index) => (
                        <div key={index}>
                          {plate.plate} ({Math.round(plate.confidence * 100)}%)
                        </div>
                      ))}
                    </div>
                  </ResultItem>
                )}
                
                {analysis.analysisResults.persons && (
                  <ResultItem>
                    <ResultLabel>Pessoas:</ResultLabel>
                    <ResultValue confidence={analysis.analysisResults.persons[0]?.confidence}>
                      {analysis.analysisResults.persons[0]?.count} 
                      ({Math.round(analysis.analysisResults.persons[0]?.confidence * 100)}%)
                    </ResultValue>
                  </ResultItem>
                )}
                
                {analysis.analysisResults.objects && (
                  <ResultItem>
                    <ResultLabel>Objetos:</ResultLabel>
                    <div>
                      {analysis.analysisResults.objects.map((obj, index) => (
                        <div key={index}>
                          {obj.name} ({Math.round(obj.confidence * 100)}%)
                        </div>
                      ))}
                    </div>
                  </ResultItem>
                )}
                
                {analysis.processingTime && (
                  <ResultItem>
                    <ResultLabel>Tempo de processamento:</ResultLabel>
                    <ResultValue>{analysis.processingTime}s</ResultValue>
                  </ResultItem>
                )}
              </AnalysisResults>
              
              <CardActions>
                <SmallButton onClick={() => handleViewDetails(analysis.id)}>
                  <Eye size={14} />
                  Detalhes
                </SmallButton>
                <SmallButton onClick={() => handleExportSingle(analysis)}>
                  <Download size={14} />
                  Exportar
                </SmallButton>
              </CardActions>
            </AnalysisCard>
          ))}
        </ResultsGrid>
      )}
    </AnalysisContainer>
  );
};

export default Analysis;