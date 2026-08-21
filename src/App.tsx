import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"

import { AppShell } from "@/components/app-shell"
import { AuthProvider } from "@/components/auth-provider"
import { AdminRoute, GuestRoute, ProtectedRoute, VentasRoute } from "@/components/auth-routes"
import { ServicioWizardPage } from "@/components/servicio-wizard/ServicioWizardPage"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { AlertasPage } from "@/pages/AlertasPage"
import { BandejaPage } from "@/pages/BandejaPage"
import { CausasPerdidaPage } from "@/pages/CausasPerdidaPage"
import { ConfiguracionPage } from "@/pages/ConfiguracionPage"
import { ConectoresPage } from "@/pages/ConectoresPage"
import { DashboardPlaceholderPage } from "@/pages/DashboardPlaceholderPage"
import { EmpresaPage } from "@/pages/EmpresaPage"
import { EmpresasPage } from "@/pages/EmpresasPage"
import { EtapasConfigPage } from "@/pages/EtapasConfigPage"
import { HomePlaceholderPage } from "@/pages/HomePlaceholderPage"
import { LoginPage } from "@/pages/LoginPage"
import { MarcaPage } from "@/pages/MarcaPage"
import { MargenesConfigPage } from "@/pages/MargenesConfigPage"
import { PipelinePage } from "@/pages/PipelinePage"
import { OportunidadPage } from "@/pages/OportunidadPage"
import { ServiciosPage } from "@/pages/ServiciosPage"
import { TarifasInternasPage } from "@/pages/TarifasInternasPage"
import { TiposDocumentoPage } from "@/pages/TiposDocumentoPage"

export default function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="prometio-theme">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route
              path="/login"
              element={
                <GuestRoute>
                  <LoginPage />
                </GuestRoute>
              }
            />
            <Route
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<HomePlaceholderPage />} />
              <Route
                path="/pipeline"
                element={
                  <VentasRoute>
                    <PipelinePage />
                  </VentasRoute>
                }
              />
              <Route
                path="/pipeline/:id"
                element={
                  <VentasRoute>
                    <OportunidadPage />
                  </VentasRoute>
                }
              />
              <Route
                path="/bandeja"
                element={
                  <VentasRoute>
                    <BandejaPage />
                  </VentasRoute>
                }
              />
              <Route
                path="/bandeja/:id"
                element={
                  <VentasRoute>
                    <BandejaPage />
                  </VentasRoute>
                }
              />
              <Route
                path="/empresas"
                element={
                  <VentasRoute>
                    <EmpresasPage />
                  </VentasRoute>
                }
              />
              <Route
                path="/empresas/:id"
                element={
                  <VentasRoute>
                    <EmpresaPage />
                  </VentasRoute>
                }
              />
              <Route
                path="/alertas"
                element={
                  <VentasRoute>
                    <AlertasPage />
                  </VentasRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <VentasRoute>
                    <DashboardPlaceholderPage />
                  </VentasRoute>
                }
              />
              <Route
                path="/configuracion"
                element={
                  <AdminRoute>
                    <ConfiguracionPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/configuracion/servicios"
                element={
                  <AdminRoute>
                    <ServiciosPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/configuracion/servicios/nuevo"
                element={
                  <AdminRoute>
                    <ServicioWizardPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/configuracion/servicios/:id"
                element={
                  <AdminRoute>
                    <ServicioWizardPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/configuracion/tarifas-internas"
                element={
                  <AdminRoute>
                    <TarifasInternasPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/configuracion/causas-perdida"
                element={
                  <AdminRoute>
                    <CausasPerdidaPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/configuracion/tipos-documento"
                element={
                  <AdminRoute>
                    <TiposDocumentoPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/configuracion/etapas"
                element={
                  <AdminRoute>
                    <EtapasConfigPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/configuracion/margenes"
                element={
                  <AdminRoute>
                    <MargenesConfigPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/configuracion/conectores"
                element={
                  <AdminRoute>
                    <ConectoresPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/configuracion/marca"
                element={
                  <AdminRoute>
                    <MarcaPage />
                  </AdminRoute>
                }
              />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  )
}
