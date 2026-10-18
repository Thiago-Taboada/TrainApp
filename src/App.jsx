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
          <Route path="/library" element={<Library />} />
          <Route path="/library/:exerciseId" element={<ExerciseDetail />} />
          <Route path="/exercises/new" element={<ExerciseEditor />} />
          <Route path="/exercises/:exerciseId/edit" element={<ExerciseEditor />} />
          <Route path="/routines" element={<Routines />} />
          <Route path="/routines/new" element={<RoutineEditor />} />
          <Route path="/routines/:routineId" element={<RoutineEditor />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/session/:weekday" element={<SessionLog />} />
          <Route path="/workout/:weekday" element={<WorkoutRunner />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/account" element={<Account />} />
          <Route path="/store" element={<Store />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/exercise/new" element={<AdminExerciseEditor />} />
          <Route path="/admin/exercise/:exerciseId" element={<AdminExerciseEditor />} />
          <Route path="/admin/routine/:routineId" element={<RoutineEditor admin />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/users/:uid" element={<AdminUserDetail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Layout>
      </LogsProvider>
    </CatalogProvider>
  )
}
