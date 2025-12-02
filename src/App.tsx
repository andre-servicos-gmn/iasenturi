import React from 'react'
import { ChakraProvider } from '@chakra-ui/react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ColorModeScript } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import theme from './styles/theme'
import Layout from './components/Layout.tsx'
import Dashboard from './components/Dashboard.tsx'
import DominiosPage from './pages/DominiosPage.tsx'
import AcoesRecomendadasPage from './pages/AcoesRecomendadasPage.tsx'

import MapaCalorPage from './pages/MapaCalorPage.tsx'
import HistoricoPage from './pages/HistoricoPage.tsx'
import EmpresasPage from './pages/EmpresasPage.tsx'
import LoginPage from './pages/LoginPage.tsx'
import AnaliseIAPage from './pages/AnaliseIAPage.tsx'
import ProtectedRoute from './components/ProtectedRoute.tsx'
import { FilterProvider } from './contexts/store'
import { AuthProvider, useAuth } from './contexts/auth'

const MotionBox = motion.div

// Componente para redirecionar usuários logados
const RedirectIfAuthenticated = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth()

  console.log('🔄 RedirectIfAuthenticated - User:', !!user, 'Loading:', loading)

  if (loading) {
    console.log('⏳ RedirectIfAuthenticated - Loading...')
    return null
  }

  if (user) {
    console.log('🔄 RedirectIfAuthenticated - User logged in, redirecting to /')
    return <Navigate to="/" replace />
  }

  console.log('✅ RedirectIfAuthenticated - Showing login page')
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Router>
      <MotionBox
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Routes>
          {/* Rota pública */}
          <Route
            path="/login"
            element={
              <RedirectIfAuthenticated>
                <LoginPage />
              </RedirectIfAuthenticated>
            }
          />

          {/* Rotas protegidas */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/dominios" element={
            <ProtectedRoute>
              <Layout>
                <DominiosPage />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/acoes-recomendadas" element={
            <ProtectedRoute>
              <Layout>
                <AcoesRecomendadasPage />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/mapa-calor" element={
            <ProtectedRoute>
              <Layout>
                <MapaCalorPage />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/historico" element={
            <ProtectedRoute>
              <Layout>
                <HistoricoPage />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/empresas" element={
            <ProtectedRoute>
              <Layout>
                <EmpresasPage />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/analise-ia" element={
            <ProtectedRoute>
              <Layout>
                <AnaliseIAPage />
              </Layout>
            </ProtectedRoute>
          } />

          {/* Redirecionar rotas não encontradas para login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </MotionBox>
    </Router>
  )
}

function App() {
  return (
    <ChakraProvider theme={theme}>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <AuthProvider>
        <FilterProvider>
          <AppRoutes />
        </FilterProvider>
      </AuthProvider>
    </ChakraProvider>
  )
}

export default App