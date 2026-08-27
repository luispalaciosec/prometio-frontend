import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"

import { AppShell } from "@/components/app-shell"
import { AuthProvider } from "@/components/auth-provider"
import { AdminRoute, GuestRoute, MarketingRoute, ProtectedRoute, VentasRoute } from "@/components/auth-routes"
import { ServicioWizardPage } from "@/components/servicio-wizard/ServicioWizardPage"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { AuthCallbackPage } from "@/pages/AuthCallbackPage"
import { BasecampCallbackPage } from "@/pages/BasecampCallbackPage"
import { AlertasPage } from "@/pages/AlertasPage"
import { ActividadesPage } from "@/pages/ActividadesPage"
import { ResumenPage } from "@/pages/ResumenPage"
import { AuditoriaPage } from "@/pages/AuditoriaPage"
import { CumpleanosPage } from "@/pages/CumpleanosPage"
import { BandejaPage } from "@/pages/BandejaPage"
import { CausasPerdidaPage } from "@/pages/CausasPerdidaPage"
import { CalendarioPage } from "@/pages/CalendarioPage"
import { ConfiguracionPage } from "@/pages/ConfiguracionPage"
import { ConectoresPage } from "@/pages/ConectoresPage"
import { ContactoPage } from "@/pages/ContactoPage"
import { ContactosPage } from "@/pages/ContactosPage"
import { DashboardPage } from "@/pages/DashboardPage"
import { EmpresaPage } from "@/pages/EmpresaPage"
import { EmpresasPage } from "@/pages/EmpresasPage"
import { EtapasConfigPage } from "@/pages/EtapasConfigPage"
import { FormularioWebPage } from "@/pages/FormularioWebPage"
import { HomePage } from "@/pages/HomePage"
import { LoginPage } from "@/pages/LoginPage"
import { MarcaPage } from "@/pages/MarcaPage"
import { MargenesConfigPage } from "@/pages/MargenesConfigPage"
import { MetaComercialPage } from "@/pages/MetaComercialPage"
import { PipelinePage } from "@/pages/PipelinePage"
import { OportunidadPage } from "@/pages/OportunidadPage"
import { SaludPage } from "@/pages/SaludPage"
import { SeoPage } from "@/pages/SeoPage"
import { ServiciosPage } from "@/pages/ServiciosPage"
import { TarifasInternasPage } from "@/pages/TarifasInternasPage"
import { TimelinePage } from "@/pages/TimelinePage"
import { CuentaPage } from "@/pages/CuentaPage"
import { TiposDocumentoPage } from "@/pages/TiposDocumentoPage"

export default function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="prometio-theme">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/auth/basecamp/callback" element={<BasecampCallbackPage />} />
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
              <Route path="/" element={<HomePage />} />
              <Route
                path="/resumen"
                element={
                  <VentasRoute>
                    <ResumenPage />
                  </VentasRoute>
                }
              />
              <Route path="/cuenta" element={<CuentaPage />} />
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
                path="/contactos"
                element={
                  <VentasRoute>
                    <ContactosPage />
                  </VentasRoute>
                }
              />
              <Route
                path="/contactos/:id"
                element={
                  <VentasRoute>
                    <ContactoPage />
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
                    <DashboardPage />
                  </VentasRoute>
                }
              />
              <Route
                path="/agenda/actividades"
                element={
                  <VentasRoute>
                    <ActividadesPage />
                  </VentasRoute>
                }
              />
              <Route
                path="/agenda/calendario"
                element={
                  <VentasRoute>
                    <CalendarioPage />
                  </VentasRoute>
                }
              />
              <Route
                path="/agenda/timeline"
                element={
                  <VentasRoute>
                    <TimelinePage />
                  </VentasRoute>
                }
              />
              <Route
                path="/cumpleanos"
                element={
                  <VentasRoute>
                    <CumpleanosPage />
                  </VentasRoute>
                }
              />
              <Route
                path="/seo"
                element={
                  <MarketingRoute>
                    <SeoPage />
                  </MarketingRoute>
                }
              />
              <Route
                path="/salud"
                element={
                  <AdminRoute>
                    <SaludPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/auditoria"
                element={
                  <AdminRoute>
                    <AuditoriaPage />
                  </AdminRoute>
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
                path="/configuracion/meta-comercial"
                element={
                  <AdminRoute>
                    <MetaComercialPage />
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
                path="/configuracion/formulario-web"
                element={
                  <AdminRoute>
                    <FormularioWebPage />
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
