import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './layout/AppLayout'
import OverviewPage from './pages/scan/OverviewPage'
import ScanHistoryPage from './pages/scan/ScanHistoryPage'
import SchedulesPage from './pages/scan/SchedulesPage'
import AllFindingsPage from './pages/findings/AllFindingsPage'
import ByResourcePage from './pages/findings/ByResourcePage'
import ByCategoryPage from './pages/findings/ByCategoryPage'
import IgnoredPage from './pages/findings/IgnoredPage'
import ConnectionsListPage from './pages/connections/ConnectionsListPage'
import NewConnectionPage from './pages/connections/NewConnectionPage'
import PreferencesPage from './pages/settings/PreferencesPage'
import ComingSoonPage from './pages/settings/ComingSoonPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Navigate to="/overview" replace />} />
            <Route path="overview" element={<OverviewPage />} />
            <Route path="scan-history" element={<ScanHistoryPage />} />
            <Route path="schedules" element={<SchedulesPage />} />
            <Route path="findings" element={<AllFindingsPage />} />
            <Route path="findings-resource" element={<ByResourcePage />} />
            <Route path="findings-category" element={<ByCategoryPage />} />
            <Route path="findings-ignored" element={<IgnoredPage />} />
            <Route path="connections" element={<ConnectionsListPage />} />
            <Route path="connections/new" element={<NewConnectionPage />} />
            <Route path="connections/:id/edit" element={<NewConnectionPage />} />
            <Route path="settings" element={<PreferencesPage />} />
            <Route path="integrations" element={<ComingSoonPage feature="Integrations" />} />
            <Route path="notifications" element={<ComingSoonPage feature="Notifications" />} />
            <Route path="access" element={<ComingSoonPage feature="Access Control" />} />
            <Route path="audit-log" element={<ComingSoonPage feature="Audit Log" />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
