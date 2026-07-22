import ReactDOM from "react-dom/client"
import App from "./App"
import ErrorBoundary from "./components/ErrorBoundary"
import { HashRouter } from "react-router-dom"
import { PostHogProvider } from "posthog-js/react"

const rootElement = document.getElementById("root")
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    // <React.StrictMode>
    <PostHogProvider
      apiKey="phc_4vF2nxwQK17nl5wIQ4sT8UJae8iHZmsjGkPxgyQJhZo"
      options={{
        api_host: "https://us.i.posthog.com",
        capture_exceptions: true,
        debug: import.meta.env.MODE === "development",
      }}
    >
      <HashRouter>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </HashRouter>
    </PostHogProvider>,
    // </React.StrictMode>
  )
}
