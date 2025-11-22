import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import styled from 'styled-components';
import Sidebar from './Sidebar/Sidebar';
import Header from './Header/Header';

const LayoutContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background-color: #f8f9fa;
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: 250px;
  
  @media (max-width: 768px) {
    margin-left: 0;
  }
`;

const Content = styled.main`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  
  @media (max-width: 768px) {
    padding: 15px;
  }
`;

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <LayoutContainer>
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      <MainContent>
        <Header onToggleSidebar={toggleSidebar} />
        <Content>
          <Outlet />
        </Content>
      </MainContent>
    </LayoutContainer>
  );
};

export default Layout;