import React from 'react';
import { NavLink } from 'react-router-dom';
import styled from 'styled-components';
import { 
  Home, 
  Upload, 
  BarChart3, 
  User, 
  Settings,
  X,
  Video
} from 'lucide-react';

const SidebarContainer = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'isOpen',
})<{ isOpen: boolean }>`
  width: 250px;
  background: #2c3e50;
  color: white;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 1000;
  transition: transform 0.3s ease;
  overflow-y: auto;
  
  @media (max-width: 768px) {
    transform: translateX(${props => props.isOpen ? '0' : '-100%'});
    width: 280px;
  }
  
  @media (min-width: 769px) {
    transform: translateX(0);
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  display: none;
  
  @media (max-width: 768px) {
    display: block;
  }
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const Logo = styled.div`
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  h2 {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0;
  }
  
  p {
    font-size: 0.9rem;
    opacity: 0.8;
    margin: 5px 0 0 0;
  }
`;

const Nav = styled.nav`
  padding: 20px 0;
`;

const NavItem = styled(NavLink)`
  display: flex;
  align-items: center;
  padding: 12px 20px;
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  transition: all 0.2s;
  border-left: 3px solid transparent;
  
  &:hover {
    background: rgba(255, 255, 255, 0.05);
    color: white;
  }
  
  &.active {
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border-left-color: #3498db;
  }
  
  svg {
    margin-right: 12px;
    width: 18px;
    height: 18px;
  }
`;

const NavSection = styled.div`
  margin-bottom: 10px;
  
  &:not(:first-child) {
    margin-top: 20px;
  }
`;

const SectionTitle = styled.div`
  padding: 10px 20px;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  opacity: 0.6;
  margin-bottom: 5px;
`;

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const mainItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/upload', icon: Upload, label: 'Upload' },
    { path: '/analysis', icon: BarChart3, label: 'Análises' },
    { path: '/realtime', icon: Video, label: 'Tempo Real' },
  ];

  const userItems = [
    { path: '/profile', icon: User, label: 'Perfil' },
    { path: '/settings', icon: Settings, label: 'Configurações' },
  ];

  return (
    <SidebarContainer isOpen={isOpen}>
      <CloseButton onClick={onToggle}>
        <X size={20} />
      </CloseButton>

      <Logo>
        <h2>Pombo Analytics</h2>
        <p>Sistema de análise</p>
      </Logo>

      <Nav>
        <NavSection>
          {mainItems.map((item) => (
            <NavItem
              key={item.path}
              to={item.path}
              onClick={() => window.innerWidth < 769 && onToggle()}
            >
              <item.icon />
              {item.label}
            </NavItem>
          ))}
        </NavSection>

        <NavSection>
          <SectionTitle>Usuário</SectionTitle>
          {userItems.map((item) => (
            <NavItem
              key={item.path}
              to={item.path}
              onClick={() => window.innerWidth < 769 && onToggle()}
            >
              <item.icon />
              {item.label}
            </NavItem>
          ))}
        </NavSection>
      </Nav>
    </SidebarContainer>
  );
};

export default Sidebar;