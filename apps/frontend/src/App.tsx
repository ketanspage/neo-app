import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router'
import Login from './pages/Login'
import UnauthLayout from './layouts/UnauthLayout'
import Register from './pages/Register'
import AuthLayout from './layouts/AuthLayout'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'
import Assignments from './pages/assignments/assignments-list'
import AssignmentAttempts from './pages/assignment-attempts'
import AssignmentDetailPage from './pages/assignments/assignment-detail-page'
import NewAssignment from './pages/assignments/new-assignment'
import Templates from './pages/template/templates-list'
import TemplateDetailPage from './pages/template/template-detail-page'
import NewTemplate from './pages/template/new-template'

function App() {
    return (
        <Router>
            <Routes>
                <Route element={<UnauthLayout />}>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                </Route>
                <Route element={<AuthLayout />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/templates" element={<Templates />} />
                    <Route path="/templates/:id" element={<TemplateDetailPage />} />
                    <Route path="/templates/new" element={<NewTemplate />} />
                    <Route path="/assignments" element={<Assignments />} />
                    <Route path="/assignments/new" element={<NewAssignment />} />
                    <Route path="/assignments/:id" element={<AssignmentDetailPage />} />
                    <Route path="/attempts/*" element={<AssignmentAttempts />} />
                    <Route path="/settings" element={<Settings />} />
                </Route>
                <Route path="/" element={<Navigate to="/login" replace />} />
            </Routes>
        </Router>
    )
}

export default App

