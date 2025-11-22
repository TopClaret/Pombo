import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Server, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

const StatusContainer = styled.div`
  margin-top: 24px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const StatusTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StatusGrid = styled.div`
  display: grid;
  gap: 12px;
`;

const StatusItem = styled.div<{ isOnline: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: ${props => props.isOnline ? '#e8f5e9' : '#ffebee'};
  border-radius: 8px;
  border-left: 4px solid ${props => props.isOnline ? '#4caf50' : '#f44336'};
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:hover {
    transform: translateX(4px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
`;

const StatusInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
`;

const StatusIcon = styled.div<{ isOnline: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${props => props.isOnline ? '#4caf50' : '#f44336'};
  color: white;
`;

const StatusDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const StatusName = styled.span`
  font-weight: 600;
  color: #333;
  font-size: 0.95rem;
`;

const StatusDescription = styled.span`
  font-size: 0.8rem;
  color: #666;
`;

const StatusBadge = styled.div<{ isOnline: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 12px;
  background: ${props => props.isOnline ? '#4caf50' : '#f44336'};
  color: white;
  font-size: 0.8rem;
  font-weight: 600;
`;

const LastCheck = styled.div`
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  color: #666;
`;

const Tooltip = styled.div<{ show: boolean }>`
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 8px;
  padding: 8px 12px;
  background: #333;
  color: white;
  border-radius: 6px;
  font-size: 0.75rem;
  white-space: nowrap;
  opacity: ${props => props.show ? 1 : 0};
  pointer-events: ${props => props.show ? 'auto' : 'none'};
  transition: opacity 0.2s;
  z-index: 1000;
  
  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 6px solid transparent;
    border-top-color: #333;
  }
`;

const StatusItemWrapper = styled.div`
  position: relative;
`;

export interface ServerInfo {
  name: string;
  url: string;
  description: string;
  type: 'api' | 'database' | 'ai-processor';
}

interface ServerStatusProps {
  servers: ServerInfo[];
  checkInterval?: number;
}

interface ServerStatusState {
  isOnline: boolean;
  lastCheck: Date | null;
  responseTime: number | null;
  error?: string;
}

const ServerStatus: React.FC<ServerStatusProps> = ({ 
  servers, 
  checkInterval = 30000 
}) => {
  const [serverStates, setServerStates] = useState<Record<string, ServerStatusState>>({});
  const [hoveredServer, setHoveredServer] = useState<string | null>(null);
  const [lastGlobalCheck, setLastGlobalCheck] = useState<Date>(new Date());

  const checkServer = async (server: ServerInfo): Promise<ServerStatusState> => {
    const startTime = performance.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
      let response: Response;
      
      if (server.type === 'database') {
        // Para banco de dados, tentar health check do backend
        response = await fetch(`${server.url.replace('/api', '')}/health`, {
          method: 'GET',
          signal: controller.signal,
        });
      } else if (server.type === 'ai-processor') {
        // Para AI Processor, verificar endpoint de health
        response = await fetch(`${server.url}/health`, {
          method: 'GET',
          signal: controller.signal,
        });
      } else {
        // Para API, verificar health check
        response = await fetch(`${server.url.replace('/api', '')}/health`, {
          method: 'GET',
          signal: controller.signal,
        });
      }
      
      clearTimeout(timeoutId);

      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      return {
        isOnline: response.ok,
        lastCheck: new Date(),
        responseTime,
        error: response.ok ? undefined : `HTTP ${response.status}`,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      const endTime = performance.now();
      return {
        isOnline: false,
        lastCheck: new Date(),
        responseTime: Math.round(endTime - startTime),
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  };

  const checkAllServers = async () => {
    const checks = servers.map(async (server) => {
      const state = await checkServer(server);
      return { server: server.name, state };
    });

    const results = await Promise.all(checks);
    const newStates: Record<string, ServerStatusState> = {};
    
    results.forEach(({ server, state }) => {
      newStates[server] = state;
    });

    setServerStates(newStates);
    setLastGlobalCheck(new Date());
  };

  useEffect(() => {
    // Verificação inicial
    checkAllServers();

    // Configurar polling
    const interval = setInterval(checkAllServers, checkInterval);

    return () => clearInterval(interval);
  }, [servers, checkInterval]);

  const formatTime = (date: Date | null) => {
    if (!date) return 'Nunca';
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return `${diff}s atrás`;
    if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
    return date.toLocaleTimeString('pt-BR');
  };

  return (
    <StatusContainer>
      <StatusTitle>
        <Server size={20} />
        Status dos Servidores
      </StatusTitle>
      
      <StatusGrid>
        {servers.map((server) => {
          const state = serverStates[server.name] || {
            isOnline: false,
            lastCheck: null,
            responseTime: null,
          };

          return (
            <StatusItemWrapper
              key={server.name}
              onMouseEnter={() => setHoveredServer(server.name)}
              onMouseLeave={() => setHoveredServer(null)}
            >
              <StatusItem isOnline={state.isOnline}>
                <StatusInfo>
                  <StatusIcon isOnline={state.isOnline}>
                    {state.isOnline ? (
                      <CheckCircle size={18} />
                    ) : (
                      <XCircle size={18} />
                    )}
                  </StatusIcon>
                  <StatusDetails>
                    <StatusName>{server.name}</StatusName>
                    <StatusDescription>{server.description}</StatusDescription>
                  </StatusDetails>
                </StatusInfo>
                <StatusBadge isOnline={state.isOnline}>
                  {state.isOnline ? (
                    <>
                      <CheckCircle size={14} />
                      Online
                    </>
                  ) : (
                    <>
                      <XCircle size={14} />
                      Offline
                    </>
                  )}
                </StatusBadge>
              </StatusItem>
              <Tooltip show={hoveredServer === server.name}>
                <div>
                  <strong>URL:</strong> {server.url}
                </div>
                {state.responseTime !== null && (
                  <div>
                    <strong>Tempo de resposta:</strong> {state.responseTime}ms
                  </div>
                )}
                {state.error && (
                  <div>
                    <strong>Erro:</strong> {state.error}
                  </div>
                )}
                {state.lastCheck && (
                  <div>
                    <strong>Última verificação:</strong> {formatTime(state.lastCheck)}
                  </div>
                )}
              </Tooltip>
            </StatusItemWrapper>
          );
        })}
      </StatusGrid>

      <LastCheck>
        <Clock size={14} />
        Última verificação: {formatTime(lastGlobalCheck)}
      </LastCheck>
    </StatusContainer>
  );
};

export default ServerStatus;

