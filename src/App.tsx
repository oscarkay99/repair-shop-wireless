import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./router";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import { ToastProvider } from "./contexts/ToastContext";
import { ThemeProvider } from "./context/ThemeContext";
import NewVersionBanner from "./components/shared/NewVersionBanner";

function App() {
  return (
    <ThemeProvider>
      <I18nextProvider i18n={i18n}>
        <ToastProvider>
          <BrowserRouter basename={__BASE_PATH__}>
            <NewVersionBanner />
            <AppRoutes />
          </BrowserRouter>
        </ToastProvider>
      </I18nextProvider>
    </ThemeProvider>
  );
}

export default App;
