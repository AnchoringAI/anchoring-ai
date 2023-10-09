import React, { Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Provider } from "react-redux";
import store from "./redux/store";
import PrivateRoute from "./routes/PrivateRoute";
import { Skeleton } from "antd";

const LoginPage = lazy(() => import("./pages/AccountManagement/LoginPage"));
const RegisterPage = lazy(() =>
  import("./pages/AccountManagement/RegisterPage")
);
const HomePage = lazy(() =>
  import("./pages/Home/HomePage")
);
const ApplicationLoader = lazy(() => import("./pages/Application/ApplicationLoader"));
const PlaygroundHomePage = lazy(() =>
  import("./pages/Playground/PlaygroundHomePage")
);
const PlaygroundPage = lazy(() => import("./pages/Playground/PlaygroundPage"));
const PlaygroundLoader = lazy(() =>
  import("./pages/Playground/PlaygroundLoader")
);
const PlaygroundGenerationPage = lazy(() => import("./pages/Playground/PlaygroundGenerationPage"));
const JobsPage = lazy(() => import("./pages/Jobs/JobsPage"));
const JobDetailPage = lazy(() => import("./pages/Jobs/JobDetailPage"));
const DataPage = lazy(() => import("./pages/Data/DataPage"));
const EmbeddingsPage = lazy(() => import("./pages/Data/EmbeddingsPage"));
const UserSettingsPage = lazy(() => import("./pages/UserSettings/UserSettingsPage"));

const App = () => {
  return (
    <Provider store={store}>
      <Router>
        <Suspense
          fallback={
            <div>
              <Skeleton active />
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/home"
              element={
                <PrivateRoute>
                  <HomePage />
                </PrivateRoute>
              }
            />
            <Route
              path="/apps/:id"
              element={
                <PrivateRoute>
                  <ApplicationLoader />
                </PrivateRoute>
              }
            />
            <Route
              path="/playground/:id"
              element={
                <PrivateRoute>
                  <PlaygroundLoader />
                </PrivateRoute>
              }
            />
            <Route
              path="/playground/new"
              element={
                <PrivateRoute>
                  <PlaygroundPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/playground/generate"
              element={
                <PrivateRoute>
                  <PlaygroundGenerationPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/apps"
              element={
                <PrivateRoute>
                  <PlaygroundHomePage />
                </PrivateRoute>
              }
            />
            <Route
              path="/jobs"
              element={
                <PrivateRoute>
                  <JobsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/jobs/:id"
              element={
                <PrivateRoute>
                  <JobDetailPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/data"
              element={
                <PrivateRoute>
                  <DataPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/data/embeddings"
              element={
                <PrivateRoute>
                  <EmbeddingsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/usersettings"
              element={
                <PrivateRoute>
                  <UserSettingsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/shared/apps/:id"
              element={
                <PrivateRoute>
                  <ApplicationLoader />
                </PrivateRoute>
              }
            />
            <Route
              path="/shared/playground/:id"
              element={
                <PrivateRoute>
                  <PlaygroundLoader />
                </PrivateRoute>
              }
            />
          </Routes>
        </Suspense>
      </Router>
    </Provider>
  );
};

export default App;
