import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { lazy, Suspense, useEffect } from 'react'
import ErrorBoundary from '../../shared/components/feedback/ErrorBoundary.jsx'
import GuestLayout from '../layouts/GuestLayout.jsx'
import AuthLayout from '../layouts/AuthLayout.jsx'
import UserLayout from '../layouts/UserLayout.jsx'
import OrganizerLayout from '../layouts/OrganizerLayout.jsx'
import AdminLayout from '../layouts/AdminLayout.jsx'
import ProtectedRoute from './ProtectedRoute.jsx'
import RoleRoute from './RoleRoute.jsx'
import { ROLES } from '../../shared/constants/roles.js'

const HomePage = lazy(() => import('../../features/events/pages/HomePage.jsx'))
const BrowseEventsPage = lazy(() => import('../../features/events/pages/BrowseEventsPage.jsx'))
const EventDetailsPage = lazy(() => import('../../features/events/pages/EventDetailsPage.jsx'))
const CreateEventPage = lazy(() => import('../../features/events/pages/CreateEventPage.jsx'))
const EditEventPage = lazy(() => import('../../features/events/pages/EditEventPage.jsx'))
const MyEventsPage = lazy(() => import('../../features/events/pages/MyEventsPage.jsx'))

const LoginPage = lazy(() => import('../../features/auth/pages/LoginPage.jsx'))
const RegisterPage = lazy(() => import('../../features/auth/pages/RegisterPage.jsx'))
const ForgotPasswordPage = lazy(() => import('../../features/auth/pages/ForgotPasswordPage.jsx'))
const ResetPasswordPage = lazy(() => import('../../features/auth/pages/ResetPasswordPage.jsx'))
const EmailVerificationPage = lazy(() => import('../../features/auth/pages/EmailVerificationPage.jsx'))

const UserDashboardPage = lazy(() => import('../../features/dashboard/user/pages/UserDashboardPage.jsx'))
const OrganizerDashboardPage = lazy(() => import('../../features/dashboard/organizer/pages/OrganizerDashboardPage.jsx'))
const OrganizerAttendeesPage = lazy(() => import('../../features/dashboard/organizer/pages/OrganizerAttendeesPage.jsx'))
const OrganizerStatisticsPage = lazy(() => import('../../features/dashboard/organizer/pages/OrganizerStatisticsPage.jsx'))
const OrganizerWalletPage = lazy(() => import('../../features/wallet/pages/OrganizerWalletPage.jsx'))
const AdminDashboardPage = lazy(() => import('../../features/dashboard/admin/pages/AdminDashboardPage.jsx'))
const AdminUsersPage = lazy(() => import('../../features/dashboard/admin/pages/AdminUsersPage.jsx'))
const AdminEventsPage = lazy(() => import('../../features/dashboard/admin/pages/AdminEventsPage.jsx'))
const AdminCategoriesPage = lazy(() => import('../../features/dashboard/admin/pages/AdminCategoriesPage.jsx'))
const AdminLocationsPage = lazy(() => import('../../features/dashboard/admin/pages/AdminLocationsPage.jsx'))
const AdminReportsPage = lazy(() => import('../../features/dashboard/admin/pages/AdminReportsPage.jsx'))
const AdminNotificationsPage = lazy(() => import('../../features/dashboard/admin/pages/AdminNotificationsPage.jsx'))
const AdminFeedbackPage = lazy(() => import('../../features/dashboard/admin/pages/AdminFeedbackPage.jsx'))
const AdminPaymentsPage = lazy(() => import('../../features/dashboard/admin/pages/AdminPaymentsPage.jsx'))
const AdminPayoutsPage = lazy(() => import('../../features/dashboard/admin/pages/AdminPayoutsPage.jsx'))
const AdminAuditLogsPage = lazy(() => import('../../features/dashboard/admin/pages/AdminAuditLogsPage.jsx'))
const AdminEmailPage = lazy(() => import('../../features/dashboard/admin/pages/AdminEmailPage.jsx'))

const ProfilePage = lazy(() => import('../../features/profile/pages/ProfilePage.jsx'))
const EditProfilePage = lazy(() => import('../../features/profile/pages/EditProfilePage.jsx'))
const ChooseInterestsPage = lazy(() => import('../../features/interests/pages/ChooseInterestsPage.jsx'))
const MyInterestsPage = lazy(() => import('../../features/interests/pages/MyInterestsPage.jsx'))
const BookmarksPage = lazy(() => import('../../features/bookmarks/pages/BookmarksPage.jsx'))
const MyRegistrationsPage = lazy(() => import('../../features/registrations/pages/MyRegistrationsPage.jsx'))
const RegistrationDetailsPage = lazy(() => import('../../features/registrations/pages/RegistrationDetailsPage.jsx'))
const TicketPage = lazy(() => import('../../features/registrations/pages/TicketPage.jsx'))
const TicketVerificationPage = lazy(() => import('../../features/tickets/pages/TicketVerificationPage.jsx'))
const TicketScannerPage = lazy(() => import('../../features/tickets/pages/TicketScannerPage.jsx'))
const PaymentPage = lazy(() => import('../../features/payments/pages/PaymentPage.jsx'))
const MyReportsPage = lazy(() => import('../../features/reports/pages/MyReportsPage.jsx'))
const NotificationsPage = lazy(() => import('../../features/notifications/pages/NotificationsPage.jsx'))
const SettingsPage = lazy(() => import('../../features/settings/pages/SettingsPage.jsx'))
const SecuritySettingsPage = lazy(() => import('../../features/settings/pages/SecuritySettingsPage.jsx'))
const NotificationSettingsPage = lazy(() => import('../../features/settings/pages/NotificationSettingsPage.jsx'))
const LanguageSettingsPage = lazy(() => import('../../features/settings/pages/LanguageSettingsPage.jsx'))
const AccountSettingsPage = lazy(() => import('../../features/settings/pages/AccountSettingsPage.jsx'))
const AppearanceSettingsPage = lazy(() => import('../../features/settings/pages/AppearanceSettingsPage.jsx'))
const SearchResultsPage = lazy(() => import('../../features/search/pages/SearchResultsPage.jsx'))
const RecommendedEventsPage = lazy(() => import('../../features/recommendations/pages/RecommendedEventsPage.jsx'))
const StatisticsPage = lazy(() => import('../../features/statistics/pages/StatisticsPage.jsx'))
const OrganizerEventDetailsPage = lazy(() => import('../../features/dashboard/organizer/pages/OrganizerEventDetailsPage.jsx'))
const PublicNotificationsPage = lazy(() => import('../../features/public/pages/PublicNotificationsPage.jsx'))
const AboutPage = lazy(() => import('../../features/about/pages/AboutPage.jsx'))
const FeedbackPage = lazy(() => import('../../features/feedback/pages/FeedbackPage.jsx'))
const OrganizersPage = lazy(() => import('../../features/organizers/pages/OrganizersPage.jsx'))
const OrganizerPublicProfilePage = lazy(() => import('../../features/organizers/pages/OrganizerPublicProfilePage.jsx'))
const TermsOfServicePage = lazy(() => import('../../features/legal/pages/TermsOfServicePage.jsx'))
const PrivacyPolicyPage = lazy(() => import('../../features/legal/pages/PrivacyPolicyPage.jsx'))

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <ErrorBoundary>
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-50"><div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" /></div>}>
        <Routes>
        <Route element={<GuestLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/events" element={<BrowseEventsPage />} />
          <Route path="/events/:id" element={<EventDetailsPage />} />
          <Route path="/search" element={<Navigate to="/events" replace />} />
          <Route path="/feedback" element={<FeedbackPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/organizers" element={<OrganizersPage />} />
          <Route path="/organizers/:id" element={<OrganizerPublicProfilePage />} />
          <Route path="/public-notifications" element={<PublicNotificationsPage />} />
          <Route path="/terms-of-service" element={<TermsOfServicePage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/tickets/verify/:ticketNumber" element={<TicketVerificationPage />} />
        </Route>

        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<EmailVerificationPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<RoleRoute allowedRoles={[ROLES.USER]} />}>
            <Route element={<UserLayout />}>
              <Route path="/dashboard" element={<UserDashboardPage />} />
              <Route path="/interests" element={<ChooseInterestsPage />} />
              <Route path="/my-interests" element={<MyInterestsPage />} />
              <Route path="/bookmarks" element={<BookmarksPage />} />
              <Route path="/registrations" element={<MyRegistrationsPage />} />
              <Route path="/registrations/:id" element={<RegistrationDetailsPage />} />
              <Route path="/tickets/:id" element={<TicketPage />} />
              <Route path="/payments/:id" element={<PaymentPage />} />
              <Route path="/recommendations" element={<RecommendedEventsPage />} />
              <Route path="/reports" element={<MyReportsPage />} />
            </Route>
          </Route>

          <Route element={<RoleRoute allowedRoles={[ROLES.USER, ROLES.ORGANIZER, ROLES.ADMIN]} />}>
            <Route element={<UserLayout />}>
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/profile/edit" element={<EditProfilePage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/settings/account" element={<AccountSettingsPage />} />
              <Route path="/settings/language" element={<LanguageSettingsPage />} />
              <Route path="/settings/appearance" element={<AppearanceSettingsPage />} />
              <Route path="/settings/notifications" element={<NotificationSettingsPage />} />
              <Route path="/settings/security" element={<SecuritySettingsPage />} />
            </Route>
          </Route>

          <Route element={<RoleRoute allowedRoles={[ROLES.ORGANIZER]} />}>
            <Route element={<OrganizerLayout />}>
              <Route path="/organizer/dashboard" element={<OrganizerDashboardPage />} />
              <Route path="/organizer/events" element={<MyEventsPage />} />
              <Route path="/organizer/events/create" element={<CreateEventPage />} />
              <Route path="/organizer/events/:id/edit" element={<EditEventPage />} />
              <Route path="/organizer/events/:id/details" element={<OrganizerEventDetailsPage />} />
              <Route path="/organizer/events/:id/attendees" element={<OrganizerAttendeesPage />} />
              <Route path="/organizer/events/:id/scanner" element={<TicketScannerPage />} />
              <Route path="/organizer/statistics" element={<OrganizerStatisticsPage />} />
              <Route path="/organizer/wallet" element={<OrganizerWalletPage />} />
            </Route>
          </Route>

          <Route element={<RoleRoute allowedRoles={[ROLES.ADMIN]} />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/events" element={<AdminEventsPage />} />
              <Route path="/admin/payments" element={<AdminPaymentsPage />} />
              <Route path="/admin/payouts" element={<AdminPayoutsPage />} />
              <Route path="/admin/events/:id/details" element={<OrganizerEventDetailsPage />} />
              <Route path="/admin/events/:id/attendees" element={<OrganizerAttendeesPage />} />
              <Route path="/admin/events/:id/scanner" element={<TicketScannerPage />} />
              <Route path="/admin/categories" element={<AdminCategoriesPage />} />
              <Route path="/admin/locations" element={<AdminLocationsPage />} />
              <Route path="/admin/reports" element={<AdminReportsPage />} />
              <Route path="/admin/notifications" element={<NotificationsPage />} />
              <Route path="/admin/announcements" element={<AdminNotificationsPage />} />
              <Route path="/admin/feedback" element={<AdminFeedbackPage />} />
              <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
              <Route path="/admin/email" element={<AdminEmailPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  )
}
