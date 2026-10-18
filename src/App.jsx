import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import { CatalogProvider } from './hooks/useCatalog'
import { LogsProvider } from './hooks/useLogs'
import Layout from './components/Layout.jsx'
import Spinner from './components/Spinner.jsx'
import Login from './pages/Login.jsx'
import VerifyEmail from './pages/VerifyEmail.jsx'
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
import WorkoutRunner from './pages/WorkoutRunner.jsx'
import Store from './pages/Store.jsx'
import Admin from './pages/Admin.jsx'
import AdminExerciseEditor from './pages/AdminExerciseEditor.jsx'
import AdminUsers from './pages/AdminUsers.jsx'
import AdminUserDetail from './pages/AdminUserDetail.jsx'

export default function App() {
  const { user, loading, needsEmailVerification } = useAuth()

  if (loading) {
    return (
      <div className="min-h-dvh">
        <Spinner label="Conectando…" />
      </div>
    )
  }

  if (!user) return <Login />

  // Email/password accounts must verify before using the app.
  if (needsEmailVerification) return <VerifyEmail />

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
          <Route path="/entrenar/:weekday" element={<WorkoutRunner />} />
          <Route path="/analisis" element={<Analysis />} />
          <Route path="/cuenta" element={<Account />} />
          <Route path="/tienda" element={<Store />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/ejercicio/nuevo" element={<AdminExerciseEditor />} />
          <Route path="/admin/ejercicio/:exerciseId" element={<AdminExerciseEditor />} />
          <Route path="/admin/rutina/:routineId" element={<RoutineEditor admin />} />
          <Route path="/admin/usuarios" element={<AdminUsers />} />
          <Route path="/admin/usuarios/:uid" element={<AdminUserDetail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Layout>
      </LogsProvider>
    </CatalogProvider>
  )
}
