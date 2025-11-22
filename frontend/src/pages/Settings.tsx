import React, { useState } from 'react';
import styled from 'styled-components';
import { Settings as SettingsIcon, Bell, Globe, Database, Shield, Save } from 'lucide-react';
import { toast } from 'react-toastify';

const SettingsContainer = styled.div`
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 30px;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const SettingsGrid = styled.div`
  display: grid;
  gap: 20px;
`;

const SettingsCard = styled.div`
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f0f0f0;
`;

const CardTitle = styled.h2`
  font-size: 1.3rem;
  font-weight: 600;
  color: #333;
  margin: 0;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-weight: 500;
  color: #555;
  font-size: 0.9rem;
`;

const Input = styled.input`
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
  
  &:focus {
    outline: none;
    border-color: #1976d2;
  }
`;

const Select = styled.select`
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
  
  &:focus {
    outline: none;
    border-color: #1976d2;
  }
`;

const CheckboxGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Checkbox = styled.input`
  width: 20px;
  height: 20px;
  cursor: pointer;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 10px;
`;

const Button = styled.button`
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.2s;
  
  &.primary {
    background: #1976d2;
    color: white;
    
    &:hover:not(:disabled) {
      background: #1565c0;
    }
  }
  
  &.secondary {
    background: #f5f5f5;
    color: #333;
    border: 1px solid #e0e0e0;
    
    &:hover:not(:disabled) {
      background: #e0e0e0;
    }
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const InfoText = styled.p`
  color: #666;
  font-size: 0.9rem;
  margin: 0;
`;

interface SettingsForm {
  notifications: {
    email: boolean;
    push: boolean;
    analysisComplete: boolean;
    errors: boolean;
  };
  api: {
    baseUrl: string;
    timeout: number;
  };
  processing: {
    autoProcess: boolean;
    maxFileSize: number;
    allowedFormats: string[];
  };
  language: string;
  theme: string;
}

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<SettingsForm>({
    notifications: {
      email: true,
      push: false,
      analysisComplete: true,
      errors: true,
    },
    api: {
      baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
      timeout: 30000,
    },
    processing: {
      autoProcess: true,
      maxFileSize: 100,
      allowedFormats: ['image/jpeg', 'image/png', 'video/mp4'],
    },
    language: 'pt-BR',
    theme: 'light',
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Salvar no localStorage por enquanto
      localStorage.setItem('appSettings', JSON.stringify(settings));
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSettings({
      notifications: {
        email: true,
        push: false,
        analysisComplete: true,
        errors: true,
      },
      api: {
        baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
        timeout: 30000,
      },
      processing: {
        autoProcess: true,
        maxFileSize: 100,
        allowedFormats: ['image/jpeg', 'image/png', 'video/mp4'],
      },
      language: 'pt-BR',
      theme: 'light',
    });
    toast.info('Configurações resetadas');
  };

  return (
    <SettingsContainer>
      <Title>
        <SettingsIcon size={32} />
        Configurações
      </Title>

      <SettingsGrid>
        {/* Notificações */}
        <SettingsCard>
          <CardHeader>
            <Bell size={24} />
            <CardTitle>Notificações</CardTitle>
          </CardHeader>
          <Form>
            <CheckboxGroup>
              <Checkbox
                type="checkbox"
                id="email"
                checked={settings.notifications.email}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    notifications: {
                      ...settings.notifications,
                      email: e.target.checked,
                    },
                  })
                }
              />
              <Label htmlFor="email">Receber notificações por email</Label>
            </CheckboxGroup>

            <CheckboxGroup>
              <Checkbox
                type="checkbox"
                id="push"
                checked={settings.notifications.push}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    notifications: {
                      ...settings.notifications,
                      push: e.target.checked,
                    },
                  })
                }
              />
              <Label htmlFor="push">Notificações push no navegador</Label>
            </CheckboxGroup>

            <CheckboxGroup>
              <Checkbox
                type="checkbox"
                id="analysisComplete"
                checked={settings.notifications.analysisComplete}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    notifications: {
                      ...settings.notifications,
                      analysisComplete: e.target.checked,
                    },
                  })
                }
              />
              <Label htmlFor="analysisComplete">Notificar quando análise for concluída</Label>
            </CheckboxGroup>

            <CheckboxGroup>
              <Checkbox
                type="checkbox"
                id="errors"
                checked={settings.notifications.errors}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    notifications: {
                      ...settings.notifications,
                      errors: e.target.checked,
                    },
                  })
                }
              />
              <Label htmlFor="errors">Notificar sobre erros</Label>
            </CheckboxGroup>
          </Form>
        </SettingsCard>

        {/* API e Conexão */}
        <SettingsCard>
          <CardHeader>
            <Globe size={24} />
            <CardTitle>API e Conexão</CardTitle>
          </CardHeader>
          <Form>
            <InputGroup>
              <Label htmlFor="apiUrl">URL da API</Label>
              <Input
                id="apiUrl"
                type="text"
                value={settings.api.baseUrl}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    api: { ...settings.api, baseUrl: e.target.value },
                  })
                }
              />
              <InfoText>URL base para comunicação com o backend</InfoText>
            </InputGroup>

            <InputGroup>
              <Label htmlFor="timeout">Timeout (ms)</Label>
              <Input
                id="timeout"
                type="number"
                value={settings.api.timeout}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    api: { ...settings.api, timeout: parseInt(e.target.value) },
                  })
                }
              />
              <InfoText>Tempo máximo de espera para requisições</InfoText>
            </InputGroup>
          </Form>
        </SettingsCard>

        {/* Processamento */}
        <SettingsCard>
          <CardHeader>
            <Database size={24} />
            <CardTitle>Processamento</CardTitle>
          </CardHeader>
          <Form>
            <CheckboxGroup>
              <Checkbox
                type="checkbox"
                id="autoProcess"
                checked={settings.processing.autoProcess}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    processing: {
                      ...settings.processing,
                      autoProcess: e.target.checked,
                    },
                  })
                }
              />
              <Label htmlFor="autoProcess">Processar arquivos automaticamente após upload</Label>
            </CheckboxGroup>

            <InputGroup>
              <Label htmlFor="maxFileSize">Tamanho máximo de arquivo (MB)</Label>
              <Input
                id="maxFileSize"
                type="number"
                value={settings.processing.maxFileSize}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    processing: {
                      ...settings.processing,
                      maxFileSize: parseInt(e.target.value),
                    },
                  })
                }
              />
            </InputGroup>
          </Form>
        </SettingsCard>

        {/* Geral */}
        <SettingsCard>
          <CardHeader>
            <Shield size={24} />
            <CardTitle>Geral</CardTitle>
          </CardHeader>
          <Form>
            <InputGroup>
              <Label htmlFor="language">Idioma</Label>
              <Select
                id="language"
                value={settings.language}
                onChange={(e) =>
                  setSettings({ ...settings, language: e.target.value })
                }
              >
                <option value="pt-BR">Português (Brasil)</option>
                <option value="en-US">English (US)</option>
                <option value="es-ES">Español</option>
              </Select>
            </InputGroup>

            <InputGroup>
              <Label htmlFor="theme">Tema</Label>
              <Select
                id="theme"
                value={settings.theme}
                onChange={(e) =>
                  setSettings({ ...settings, theme: e.target.value })
                }
              >
                <option value="light">Claro</option>
                <option value="dark">Escuro</option>
                <option value="auto">Automático</option>
              </Select>
            </InputGroup>
          </Form>
        </SettingsCard>

        {/* Botões de ação */}
        <SettingsCard>
          <ButtonGroup>
            <Button
              type="button"
              className="primary"
              onClick={handleSave}
              disabled={isLoading}
            >
              <Save size={16} />
              {isLoading ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
            <Button
              type="button"
              className="secondary"
              onClick={handleReset}
              disabled={isLoading}
            >
              Restaurar Padrões
            </Button>
          </ButtonGroup>
        </SettingsCard>
      </SettingsGrid>
    </SettingsContainer>
  );
};

export default Settings;

