import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Navbar from './components/Navbar';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Courses from './pages/Courses';
import CourseDetails from './pages/CourseDetails';
import PaymentResult from './pages/PaymentResult';
import StudentDashboard from './pages/StudentDashboard';
import CoursePlayer from './pages/CoursePlayer';
import QuizPage from './pages/QuizPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCourses from './pages/admin/AdminCourses';
import AdminCourseEditor from './pages/admin/AdminCourseEditor';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:id" element={<CourseDetails />} />
          <Route path="/payment/result" element={<PaymentResult />} />

          <Route element={<ProtectedRoute role="Student" />}>
            <Route path="/dashboard" element={<StudentDashboard />} />
            <Route path="/learn/:courseId" element={<CoursePlayer />} />
            <Route path="/learn/:courseId/quiz" element={<QuizPage />} />
          </Route>

          <Route element={<ProtectedRoute role="Admin" />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/courses" element={<AdminCourses />} />
            <Route path="/admin/courses/:id" element={<AdminCourseEditor />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}