import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { 
  BarChart3, 
  Upload, 
  CheckCircle, 
  Clock,
  AlertCircle, 
  Loader
} from 'lucide-react';
import { toast } from 'react-toastify';
import { getSupabase } from '../services/supabaseClient';

const DashboardContainer = styled.div`
  padding: 20px;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 30px;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const StatCard = styled.div`
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 16px;
`;

const StatIcon = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &.primary {
    background: #e3f2fd;
    color: #1976d2;
  }
  
  &.success {
    background: #e8f5e8;
    color: #2e7d32;
  }
  
  &.warning {
    background: #fff3e0;
    color: #f57c00;
  }
  
  &.error {
    background: #ffebee;
    color: #d32f2f;
  }
`;

const StatContent = styled.div`
  flex: 1;
`;

const StatValue = styled.div`
  font-size: 1.8rem;
  font-weight: 700;
  color: #333;
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  color: #666;
  margin-top: 4px;
`;

const Section = styled.section`
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
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const RecentActivityList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ActivityItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  background: #f8f9fa;
  
  &:hover {
    background: #e9ecef;
  }
`;

const ActivityIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &.success {
    background: #e8f5e8;
    color: #2e7d32;
  }
  
  &.processing {
    background: #fff3e0;
    color: #f57c00;
  }
  
  &.error {
    background: #ffebee;
    color: #d32f2f;
  }
`;

const ActivityContent = styled.div`
  flex: 1;
`;

const ActivityTitle = styled.div`
  font-weight: 500;
  color: #333;
`;

const ActivityTime = styled.div`
  font-size: 0.8rem;
  color: #666;
  margin-top: 2px;
`;

const QuickActions = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
`;

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const ActionButton = styled.button<{ isLoading?: boolean }>`
  background: white;
  border: 2px solid #e0e0e0;
  padding: 16px;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;

  &:hover {
    border-color: #1976d2;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  ${props => props.isLoading && `
    cursor: progress;
    opacity: 0.7;
    pointer-events: none;
    &:hover {
      transform: none;
      box-shadow: none;
    }
  `}
  
  svg {
    margin-bottom: 8px;
    color: #1976d2;
    ${props => props.isLoading && `
      animation: ${rotate} 1s linear infinite;
    `}
  }
  
  div {
    font-weight: 500;
    color: #333;
  }
`;

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [isLoadingUpload, setIsLoadingUpload] = useState(false);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);

  useEffect(() => {
    const testSupabase = async () => {
      try {
        const client = getSupabase();
        const { error, count } = await client
          .from('users')
          .select('*', { count: 'exact', head: true });

        if (error) {
          toast.error(`Supabase offline: ${error.message}`);
        } else {
          toast.success(`Supabase online (users: ${count ?? 0})`);
        }
      } catch (e: any) {
        toast.error(`Falha ao conectar Supabase: ${e.message || 'erro desconhecido'}`);
      }
    };
    testSupabase();
  }, []);


  const stats = [
    {
      icon: Upload,
      value: '158',
      label: 'Total de Uploads',
      type: 'primary'
    },
    {
      icon: CheckCircle,
      value: '124',
      label: 'Análises Concluídas',
      type: 'success'
    },
    {
      icon: Clock,
      value: '12',
      label: 'Em Processamento',
      type: 'warning'
    },
    {
      icon: AlertCircle,
      value: '22',
      label: 'Falhas na Análise',
      type: 'error'
    }
  ];

  const recentActivities = [
    {
      icon: CheckCircle,
      title: 'Análise concluída - imagem_001.jpg',
      time: '2 minutos atrás',
      status: 'success'
    },
    {
      icon: Clock,
      title: 'Processando - video_045.mp4',
      time: '5 minutos atrás',
      status: 'processing'
    },
    {
      icon: CheckCircle,
      title: 'Análise concluída - documento.pdf',
      time: '10 minutos atrás',
      status: 'success'
    },
    {
      icon: AlertCircle,
      title: 'Falha na análise - arquivo_corrompido.avi',
      time: '15 minutos atrás',
      status: 'error'
    }
  ];

  const quickActions = [
    {
      icon: isLoadingUpload ? Loader : Upload,
      label: isLoadingUpload ? 'Carregando...' : 'Novo Upload',
      onClick: async () => {
        setIsLoadingUpload(true);
        try {
          await new Promise(resolve => setTimeout(resolve, 500)); // Simula atraso
          navigate('/upload');
        } catch (error) {
          toast.error('Erro ao navegar para Upload.');
        } finally {
          setIsLoadingUpload(false);
        }
      },
      isLoading: isLoadingUpload
    },
    {
      icon: isLoadingAnalysis ? Loader : BarChart3,
      label: isLoadingAnalysis ? 'Carregando...' : 'Ver Análises',
      onClick: async () => {
        setIsLoadingAnalysis(true);
        try {
          await new Promise(resolve => setTimeout(resolve, 500)); // Simula atraso
          navigate('/analysis');
        } catch (error) {
          toast.error('Erro ao navegar para Análises.');
        } finally {
          setIsLoadingAnalysis(false);
        }
      },
      isLoading: isLoadingAnalysis
    }
  ];

  return (
    <DashboardContainer>
      <Title>Dashboard</Title>
      
      <StatsGrid>
        {stats.map((stat, index) => (
          <StatCard key={index}>
            <StatIcon className={stat.type}>
              <stat.icon size={24} />
            </StatIcon>
            <StatContent>
              <StatValue>{stat.value}</StatValue>
              <StatLabel>{stat.label}</StatLabel>
            </StatContent>
          </StatCard>
        ))}
      </StatsGrid>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        <Section>
          <SectionTitle>
            <Clock size={20} />
            Atividades Recentes
          </SectionTitle>
          <RecentActivityList>
            {recentActivities.map((activity, index) => (
              <ActivityItem key={index}>
                <ActivityIcon className={activity.status}>
                  <activity.icon size={16} />
                </ActivityIcon>
                <ActivityContent>
                  <ActivityTitle>{activity.title}</ActivityTitle>
                  <ActivityTime>{activity.time}</ActivityTime>
                </ActivityContent>
              </ActivityItem>
            ))}
          </RecentActivityList>
        </Section>

        <Section>
          <SectionTitle>Ações Rápidas</SectionTitle>
          <QuickActions>
            {quickActions.map((action, index) => (
              <ActionButton key={index} onClick={action.onClick}>
                <action.icon size={24} />
                <div>{action.label}</div>
              </ActionButton>
            ))}
          </QuickActions>
        </Section>
      </div>
    </DashboardContainer>
  );
};

export default Dashboard;
