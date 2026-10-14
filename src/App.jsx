import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import { CatalogProvider } from './hooks/useCatalog'
import { LogsProvider } from './hooks/useLogs'
import Layout from './components/Layout.jsx'
import Spinner from './components/Spinner.jsx'
import Login from './pages/Login.jsx'
import Today from './pages/Today.jsx'
import Library from './pages/Library.jsx'
import ExerciseDetail from './pages/ExerciseDetail.jsx'
import Schedule from './pages/Schedule.jsx'
import SessionLog from './pages/SessionLog.jsx'
import Analysis from './pages/Analysis.jsx'
import Routines from './pages/Routines.jsx'
import RoutineEditor from './pages/RoutineEditor.jsx'
import ExerciseEditor from './pages/ExerciseEditor.jsx'
import Account from './pages/Account.jsx'

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-dvh">
        <Spinner label="Conectando…" />
      </div>
    )
  }

  if (!user) return <Login />

  return (
    <CatalogProvider>
      <LogsProvider>
        <Layout>
        <Routes>
          <Route path="/" element={<Today />} />
          <Route path="/biblioteca" element={<Library />} />
          <Route path="/biblioteca/:exerciseId" element={<ExerciseDetail />} />
          <Route path="/ejercicios/nuevo" element={<ExerciseEditor />} />
          <Route path="/ejercicios/:exerciseId/editar" element={<ExerciseEditor />} />
          <Route path="/rutinas" element={<Routines />} />
          <Route path="/rutinas/nueva" element={<RoutineEditor />} />
          <Route path="/rutinas/:routineId" element={<RoutineEditor />} />
          <Route path="/cronograma" element={<Schedule />} />
          <Route path="/sesion/:weekday" element={<SessionLog />} />
          <Route path="/analisis" element={<Analysis />} />
          <Route path="/cuenta" element={<Account />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Layout>
      </LogsProvider>
    </CatalogProvider>
  )
}
