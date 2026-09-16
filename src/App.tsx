import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { RequireAuth } from "@/components/RequireAuth";
import { Toaster } from "@/components/ui/toast";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { ExamPage } from "@/pages/ExamPage";
import { LoginPage } from "@/pages/LoginPage";
import { NewTestPage } from "@/pages/NewTestPage";
import { QuestionPage } from "@/pages/QuestionPage";
import { QuestionsPage } from "@/pages/QuestionsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { SubmissionPage } from "@/pages/SubmissionPage";
import { SubmissionsPage } from "@/pages/SubmissionsPage";
import { SyllabusPage } from "@/pages/SyllabusPage";
import { TestPage } from "@/pages/TestPage";
import { TestsPage } from "@/pages/TestsPage";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Toaster>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route element={<RequireAuth />}>
                {/* The test runner has its own full-screen layout without tabs. */}
                <Route path="/tests/:id" element={<TestPage />} />
                <Route element={<AppLayout />}>
                  <Route path="/" element={<Navigate to="/tests" replace />} />
                  <Route path="/syllabus" element={<SyllabusPage />} />
                  <Route path="/syllabus/:id" element={<ExamPage />} />
                  <Route path="/questions" element={<QuestionsPage />} />
                  <Route path="/questions/:id" element={<QuestionPage />} />
                  <Route path="/tests" element={<TestsPage />} />
                  <Route path="/tests/new" element={<NewTestPage />} />
                  <Route path="/submissions" element={<SubmissionsPage />} />
                  <Route path="/submissions/:id" element={<SubmissionPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </Toaster>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
