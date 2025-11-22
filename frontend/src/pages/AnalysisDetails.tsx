import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { ArrowLeft, Download, Eye, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { uploadAPI } from '../services/api';

const DetailsContainer = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
  
  &:hover {
    background: #e0e0e0;
  }
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 600;
  color: #333;
  margin: 0;
`;

const DetailsCard = styled.div`
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
`;

const SectionTitle = styled.h2`
  font-size: 1.3rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const InfoLabel = styled.span`
  font-size: 0.8rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const InfoValue = styled.span<{ status?: string }>`
  font-size: 1.1rem;
  font-weight: 600;
  color: ${props => {
    if (props.status === 'completed') return '#2e7d32';
    if (props.status === 'processing') return '#f57c00';
    if (props.status === 'failed') return '#d32f2f';
    return '#333';
  }};
`;

const StatusBadge = styled.div<{ status: string }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
  background: ${props => {
    if (props.status === 'completed') return '#e8f5e9';
    if (props.status === 'processing') return '#fff3e0';
    if (props.status === 'failed') return '#ffebee';
    return '#f5f5f5';
  }};
  color: ${props => {
    if (props.status === 'completed') return '#2e7d32';
    if (props.status === 'processing') return '#f57c00';
    if (props.status === 'failed') return '#d32f2f';
    return '#666';
  }};
`;

const ResultsSection = styled.div`
  margin-top: 20px;
`;

const ResultItem = styled.div`
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 12px;
`;

const ResultLabel = styled.div`
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
`;

const ResultContent = styled.div`
  color: #666;
  font-size: 0.9rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 20px;
`;

const Button = styled.button`
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.2s;
  
  &.primary {
    background: #1976d2;
    color: white;
    
    &:hover {
      background: #1565c0;
    }
  }
  
  &.secondary {
    background: #f5f5f5;
    color: #333;
    border: 1px solid #e0e0e0;
    
    &:hover {
      background: #e0e0e0;
    }
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 40px;
  color: #666;
`;

const AnalysisDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadAnalysisDetails();
    }
  }, [id]);

  const loadAnalysisDetails = async () => {
    try {
      setLoading(true);
      const response = await uploadAPI.getUploadDetails(id!);
      setAnalysis(response.data.data.upload);
    } catch (error) {
      toast.error('Erro ao carregar detalhes da análise');
      navigate('/analysis');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!analysis) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(analysis, null, 2)
    )}`;
    const link = document.createElement('a');
    link.href = jsonString;
    link.download = `${analysis.originalName || 'analise'}_detalhes.json`;
    link.click();
    toast.success('Análise exportada com sucesso!');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} />;
      case 'processing':
        return <Clock size={16} />;
      case 'failed':
        return <XCircle size={16} />;
      default:
        return <AlertCircle size={16} />;
    }
  };

  if (loading) {
    return (
      <DetailsContainer>
        <LoadingMessage>Carregando detalhes...</LoadingMessage>
      </DetailsContainer>
    );
  }

  if (!analysis) {
    return (
      <DetailsContainer>
        <LoadingMessage>Análise não encontrada</LoadingMessage>
      </DetailsContainer>
    );
  }

  return (
    <DetailsContainer>
      <Header>
        <BackButton onClick={() => navigate('/analysis')}>
          <ArrowLeft size={16} />
          Voltar
        </BackButton>
        <Title>Detalhes da Análise</Title>
      </Header>

      <DetailsCard>
        <SectionTitle>Informações Gerais</SectionTitle>
        <InfoGrid>
          <InfoItem>
            <InfoLabel>Arquivo</InfoLabel>
            <InfoValue>{analysis.originalName || 'N/A'}</InfoValue>
          </InfoItem>
          <InfoItem>
            <InfoLabel>Tipo</InfoLabel>
            <InfoValue>
              {analysis.fileType?.includes('image') ? 'Imagem' : 'Vídeo'}
            </InfoValue>
          </InfoItem>
          <InfoItem>
            <InfoLabel>Status</InfoLabel>
            <StatusBadge status={analysis.status}>
              {getStatusIcon(analysis.status)}
              {analysis.status === 'completed' ? 'Concluído' :
               analysis.status === 'processing' ? 'Processando' :
               analysis.status === 'failed' ? 'Falha' : analysis.status}
            </StatusBadge>
          </InfoItem>
          <InfoItem>
            <InfoLabel>Data de Criação</InfoLabel>
            <InfoValue>
              {new Date(analysis.createdAt).toLocaleString('pt-BR')}
            </InfoValue>
          </InfoItem>
          {analysis.processingTime && (
            <InfoItem>
              <InfoLabel>Tempo de Processamento</InfoLabel>
              <InfoValue>{analysis.processingTime}s</InfoValue>
            </InfoItem>
          )}
        </InfoGrid>

        <ResultsSection>
          <SectionTitle>Resultados da Análise</SectionTitle>
          {analysis.analysisResults && Object.keys(analysis.analysisResults).length > 0 ? (
            <>
              {analysis.analysisResults.licensePlates && (
                <ResultItem>
                  <ResultLabel>Placas Detectadas</ResultLabel>
                  <ResultContent>
                    {analysis.analysisResults.licensePlates.map((plate: any, index: number) => (
                      <div key={index}>
                        {plate.plate} (Confiança: {Math.round(plate.confidence * 100)}%)
                      </div>
                    ))}
                  </ResultContent>
                </ResultItem>
              )}

              {analysis.analysisResults.persons && (
                <ResultItem>
                  <ResultLabel>Pessoas Detectadas</ResultLabel>
                  <ResultContent>
                    {analysis.analysisResults.persons.map((person: any, index: number) => (
                      <div key={index}>
                        {person.count} pessoa(s) (Confiança: {Math.round(person.confidence * 100)}%)
                      </div>
                    ))}
                  </ResultContent>
                </ResultItem>
              )}

              {analysis.analysisResults.objects && (
                <ResultItem>
                  <ResultLabel>Objetos Detectados</ResultLabel>
                  <ResultContent>
                    {analysis.analysisResults.objects.map((obj: any, index: number) => (
                      <div key={index}>
                        {obj.name} (Confiança: {Math.round(obj.confidence * 100)}%)
                      </div>
                    ))}
                  </ResultContent>
                </ResultItem>
              )}

              {analysis.analysisResults.text && (
                <ResultItem>
                  <ResultLabel>Texto Detectado</ResultLabel>
                  <ResultContent>
                    {analysis.analysisResults.text.map((text: any, index: number) => (
                      <div key={index}>
                        {text.text} (Confiança: {Math.round(text.confidence * 100)}%)
                      </div>
                    ))}
                  </ResultContent>
                </ResultItem>
              )}

              {analysis.analysisResults.colors && (
                <ResultItem>
                  <ResultLabel>Cores Detectadas</ResultLabel>
                  <ResultContent>
                    {analysis.analysisResults.colors.map((color: any, index: number) => (
                      <div key={index}>
                        {color.color}: {color.percentage.toFixed(2)}%
                      </div>
                    ))}
                  </ResultContent>
                </ResultItem>
              )}
            </>
          ) : (
            <ResultItem>
              <ResultContent>Nenhum resultado disponível</ResultContent>
            </ResultItem>
          )}
        </ResultsSection>

        <ButtonGroup>
          <Button className="primary" onClick={handleExport}>
            <Download size={16} />
            Exportar JSON
          </Button>
        </ButtonGroup>
      </DetailsCard>
    </DetailsContainer>
  );
};

export default AnalysisDetails;

