import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Menu, Bell, User } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

const HeaderContainer = styled.header`
  background: #fff;
  border-bottom: 1px solid #e0e0e0;
  padding: 0 20px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  
  @media (max-width: 768px) {
    padding: 0 15px;
  }
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`;

const MenuButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #f0f0f0;
  }
  
  @media (min-width: 769px) {
    display: none;
  }
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  
  @media (max-width: 768px) {
    font-size: 1.2rem;
  }
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`;

const IconButton = styled.button<{ active?: boolean }>`
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
  position: relative;

  ${(props: { active?: boolean }) =>
    props.active &&
    `
    background-color: #e0e0e0;
  `}
  
  &:hover {
    background-color: #f0f0f0;
  }
`;

const NotificationBadge = styled.span`
  position: absolute;
  top: 4px;
  right: 4px;
  background: #ff4757;
  color: white;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #f0f0f0;
  }
`;

const UserName = styled.span`
  font-weight: 500;
  color: #333;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const NotificationDropdown = styled.div`
  position: absolute;
  top: 50px; /* Ajuste conforme necessário para posicionar abaixo do ícone */
  right: 0;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  width: 300px;
  max-height: 400px;
  overflow-y: auto;
  z-index: 1000;
  padding: 10px;

  @media (max-width: 768px) {
    width: 250px;
  }
`;

const NotificationItem = styled.div`
  padding: 10px;
  border-bottom: 1px solid #eee;
  &:last-child {
    border-bottom: none;
  }
  p {
    margin: 0;
    font-size: 0.9rem;
    color: #333;
  }
  span {
    font-size: 0.75rem;
    color: #999;
  }
`;

interface HeaderProps {
  onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [errorNotifications, setErrorNotifications] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

  const fetchNotifications = async () => {
    setLoadingNotifications(true);
    setErrorNotifications(null);
    try {
      // Simular uma chamada de API
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockNotifications = [
        { id: 1, message: 'Nova análise concluída!', time: 'Há 5 minutos' },
        { id: 2, message: 'Seu upload foi processado.', time: 'Há 1 hora' },
        { id: 3, message: 'Bem-vindo ao Pombo Analytics!', time: 'Há 1 dia' },
      ];
      // Simular um erro aleatório para demonstração
      if (Math.random() > 0.8) {
        throw new Error('Falha ao carregar notificações.');
      }
      setNotifications(mockNotifications);
    } catch (error: any) {
      setErrorNotifications(error.message);
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    if (showNotifications) {
      fetchNotifications();
    }
  }, [showNotifications]);

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
  };

  return (
    <HeaderContainer>
      <LeftSection>
        <MenuButton onClick={onToggleSidebar}>
          <Menu size={20} />
        </MenuButton>
        <Title>Pombo Analytics</Title>
      </LeftSection>

      <RightSection>
        <IconButton onClick={handleNotificationClick} active={showNotifications}>
          <Bell size={20} />
          <NotificationBadge>3</NotificationBadge>
        </IconButton>
        {showNotifications && (
          <NotificationDropdown>
            {loadingNotifications && <NotificationItem><p>Carregando notificações...</p></NotificationItem>}
            {errorNotifications && <NotificationItem><p style={{ color: 'red' }}>Erro: {errorNotifications}</p></NotificationItem>}
            {!loadingNotifications && !errorNotifications && notifications.length === 0 && (
              <NotificationItem><p>Nenhuma notificação.</p></NotificationItem>
            )}
            {!loadingNotifications && !errorNotifications && notifications.length > 0 && (
              notifications.map(notification => (
                <NotificationItem key={notification.id}>
                  <p>{notification.message}</p>
                  <span>{notification.time}</span>
                </NotificationItem>
              ))
            )}
          </NotificationDropdown>
        )}
        
        <UserInfo onClick={logout}>
          <User size={20} />
          <UserName>{user?.name}</UserName>
        </UserInfo>
      </RightSection>
    </HeaderContainer>
  );
};

export default Header;