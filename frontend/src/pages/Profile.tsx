import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { User, Mail, Save, Edit3, Key } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';

const ProfileContainer = styled.div`
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 30px;
`;

const ProfileCard = styled.div`
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const Section = styled.section`
  margin-bottom: 30px;
  
  &:last-child {
    margin-bottom: 0;
  }
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
  display: flex;
  align-items: center;
  gap: 8px;
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
  
  &:disabled {
    background: #f5f5f5;
    color: #666;
  }
`;

const ErrorMessage = styled.span`
  color: #e74c3c;
  font-size: 0.8rem;
  margin-top: 4px;
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

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-top: 20px;
`;

const StatCard = styled.div`
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1976d2;
`;

const StatLabel = styled.div`
  font-size: 0.8rem;
  color: #666;
  margin-top: 4px;
`;

interface ProfileForm {
  name: string;
  email: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    reset: resetProfile,
  } = useForm<ProfileForm>();

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
    watch,
  } = useForm<PasswordForm>();

  const newPassword = watch('newPassword');

  useEffect(() => {
    if (user) {
      resetProfile({
        name: user.name,
        email: user.email
      });
    }
  }, [user, resetProfile]);

  const handleProfileUpdate = async (data: ProfileForm) => {
    setIsLoading(true);
    try {
      await authAPI.updateProfile(data);
      updateUser(data);
      setIsEditing(false);
      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (data: PasswordForm) => {
    setIsLoading(true);
    try {
      await authAPI.changePassword(data.currentPassword, data.newPassword);
      resetPassword();
      setIsChangingPassword(false);
      toast.success('Senha alterada com sucesso!');
    } catch (error) {
      toast.error('Erro ao alterar senha');
    } finally {
      setIsLoading(false);
    }
  };

  const cancelEdit = () => {
    resetProfile({
      name: user?.name || '',
      email: user?.email || ''
    });
    setIsEditing(false);
  };

  const cancelPasswordChange = () => {
    resetPassword();
    setIsChangingPassword(false);
  };

  if (!user) {
    return (
      <ProfileContainer>
        <Title>Perfil</Title>
        <div>Carregando...</div>
      </ProfileContainer>
    );
  }

  return (
    <ProfileContainer>
      <Title>Perfil</Title>
      
      <ProfileCard>
        <Section>
          <SectionTitle>
            <User size={20} />
            Informações Pessoais
          </SectionTitle>
          
          <Form onSubmit={handleProfileSubmit(handleProfileUpdate)}>
            <InputGroup>
              <Label htmlFor="name">
                <User size={16} />
                Nome completo
              </Label>
              <Input
                id="name"
                type="text"
                disabled={!isEditing}
                {...registerProfile('name', {
                  required: 'Nome é obrigatório',
                  minLength: {
                    value: 2,
                    message: 'Nome deve ter pelo menos 2 caracteres',
                  },
                })}
              />
              {profileErrors.name && (
                <ErrorMessage>{profileErrors.name.message}</ErrorMessage>
              )}
            </InputGroup>

            <InputGroup>
              <Label htmlFor="email">
                <Mail size={16} />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                disabled={!isEditing}
                {...registerProfile('email', {
                  required: 'Email é obrigatório',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Email inválido',
                  },
                })}
              />
              {profileErrors.email && (
                <ErrorMessage>{profileErrors.email.message}</ErrorMessage>
              )}
            </InputGroup>

            {isEditing ? (
              <ButtonGroup>
                <Button type="submit" className="primary" disabled={isLoading}>
                  <Save size={16} />
                  {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
                <Button 
                  type="button" 
                  className="secondary" 
                  onClick={cancelEdit}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
              </ButtonGroup>
            ) : (
              <Button 
                type="button" 
                className="primary" 
                onClick={() => setIsEditing(true)}
              >
                <Edit3 size={16} />
                Editar Perfil
              </Button>
            )}
          </Form>
        </Section>

        <Section>
          <SectionTitle>
            <Key size={20} />
            Segurança
          </SectionTitle>
          
          {isChangingPassword ? (
            <Form onSubmit={handlePasswordSubmit(handlePasswordChange)}>
              <InputGroup>
                <Label htmlFor="currentPassword">Senha atual</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  {...registerPassword('currentPassword', {
                    required: 'Senha atual é obrigatória',
                  })}
                />
                {passwordErrors.currentPassword && (
                  <ErrorMessage>{passwordErrors.currentPassword.message}</ErrorMessage>
                )}
              </InputGroup>

              <InputGroup>
                <Label htmlFor="newPassword">Nova senha</Label>
                <Input
                  id="newPassword"
                  type="password"
                  {...registerPassword('newPassword', {
                    required: 'Nova senha é obrigatória',
                    minLength: {
                      value: 6,
                      message: 'Senha deve ter pelo menos 6 caracteres',
                    },
                  })}
                />
                {passwordErrors.newPassword && (
                  <ErrorMessage>{passwordErrors.newPassword.message}</ErrorMessage>
                )}
              </InputGroup>

              <InputGroup>
                <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...registerPassword('confirmPassword', {
                    required: 'Confirmação de senha é obrigatória',
                    validate: (value) =>
                      value === newPassword || 'As senhas não coincidem',
                  })}
                />
                {passwordErrors.confirmPassword && (
                  <ErrorMessage>{passwordErrors.confirmPassword.message}</ErrorMessage>
                )}
              </InputGroup>

              <ButtonGroup>
                <Button type="submit" className="primary" disabled={isLoading}>
                  <Save size={16} />
                  {isLoading ? 'Salvando...' : 'Alterar Senha'}
                </Button>
                <Button 
                  type="button" 
                  className="secondary" 
                  onClick={cancelPasswordChange}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
              </ButtonGroup>
            </Form>
          ) : (
            <Button 
              type="button" 
              className="secondary" 
              onClick={() => setIsChangingPassword(true)}
            >
              <Key size={16} />
              Alterar Senha
            </Button>
          )}
        </Section>

        <Section>
          <SectionTitle>Estatísticas</SectionTitle>
          <StatsGrid>
            <StatCard>
              <StatValue>158</StatValue>
              <StatLabel>Total de Uploads</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>124</StatValue>
              <StatLabel>Análises Concluídas</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>12</StatValue>
              <StatLabel>Em Processamento</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>22</StatValue>
              <StatLabel>Falhas na Análise</StatLabel>
            </StatCard>
          </StatsGrid>
        </Section>
      </ProfileCard>
    </ProfileContainer>
  );
};

export default Profile;