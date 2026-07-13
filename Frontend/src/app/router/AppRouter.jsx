import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import GuestLayout from '../layouts/GuestLayout.jsx'
import AuthLayout from '../layouts/AuthLayout.jsx'
import UserLayout from '../layouts/UserLayout.jsx'
import OrganizerLayout from '../layouts/OrganizerLayout.jsx'
import AdminLayout from '../layouts/AdminLayout.jsx'
import ProtectedRoute from './ProtectedRoute.jsx'
import RoleRoute from './RoleRoute.jsx'
import { ROLES } from '../../shared/constants/roles.js'

import HomePage from '../../features/events/pages/HomePage.jsx'
import BrowseEventsPage from '../../features/events/pages/BrowseEventsPage.jsx'
import EventDetailsPage from '../../features/events/pages/EventDetailsPage.jsx'
import CreateEventPage from '../../features/events/pages/CreateEventPage.jsx'
import EditEventPage from '../../features/events/pages/EditEventPage.jsx'
import MyEventsPage from '../../features/events/pages/MyEventsPage.jsx'

import LoginPage from '../../features/auth/pages/LoginPage.jsx'
import RegisterPage from '../../features/auth/pages/RegisterPage.jsx'
import ForgotPasswordPage from '../../features/auth/pages/ForgotPasswordPage.jsx'
import ResetPasswordPage from '../../features/auth/pages/ResetPasswordPage.jsx'
import EmailVerificationPage from '../../features/auth/pages/EmailVerificationPage.jsx'

import UserDashboardPage from '../../features/dashboard/user/pages/UserDashboardPage.jsx'
import OrganizerDashboardPage from '../../features/dashboard/organizer/pages/OrganizerDashboardPage.jsx'
import OrganizerAttendeesPage from '../../features/dashboard/organizer/pages/OrganizerAttendeesPage.jsx'
import OrganizerStatisticsPage from '../../features/dashboard/organizer/pages/OrganizerStatisticsPage.jsx'
import AdminDashboardPage from '../../features/dashboard/admin/pages/AdminDashboardPage.jsx'
import AdminUsersPage from '../../features/dashboard/admin/pages/AdminUsersPage.jsx'
import AdminEventsPage from '../../features/dashboard/admin/pages/AdminEventsPage.jsx'
import AdminCategoriesPage from '../../features/dashboard/admin/pages/AdminCategoriesPage.jsx'
import AdminLocationsPage from '../../features/dashboard/admin/pages/AdminLocationsPage.jsx'
import AdminReportsPage from '../../features/dashboard/admin/pages/AdminReportsPage.jsx'
import AdminNotificationsPage from '../../features/dashboard/admin/pages/AdminNotificationsPage.jsx'
import AdminFeedbackPage from '../../features/dashboard/admin/pages/AdminFeedbackPage.jsx'

import ProfilePage from '../../features/profile/pages/ProfilePage.jsx'
import EditProfilePage from '../../features/profile/pages/EditProfilePage.jsx'
import ChooseInterestsPage from '../../features/interests/pages/ChooseInterestsPage.jsx'
import MyInterestsPage from '../../features/interests/pages/MyInterestsPage.jsx'
import BookmarksPage from '../../features/bookmarks/pages/BookmarksPage.jsx'
import MyRegistrationsPage from '../../features/registrations/pages/MyRegistrationsPage.jsx'
import RegistrationDetailsPage from '../../features/registrations/pages/RegistrationDetailsPage.jsx'
import TicketPage from '../../features/registrations/pages/TicketPage.jsx'
import PaymentPage from '../../features/payments/pages/PaymentPage.jsx'
import MyReportsPage from '../../features/reports/pages/MyReportsPage.jsx'
import NotificationsPage from '../../features/notifications/pages/NotificationsPage.jsx'
import SettingsPage from '../../features/settings/pages/SettingsPage.jsx'
import SecuritySettingsPage from '../../features/settings/pages/SecuritySettingsPage.jsx'
import NotificationSettingsPage from '../../features/settings/pages/NotificationSettingsPage.jsx'
import LanguageSettingsPage from '../../features/settings/pages/LanguageSettingsPage.jsx'
import AccountSettingsPage from '../../features/settings/pages/AccountSettingsPage.jsx'
import SearchResultsPage from '../../features/search/pages/SearchResultsPage.jsx'
import RecommendedEventsPage from '../../features/recommendations/pages/RecommendedEventsPage.jsx'
import StatisticsPage from '../../features/statistics/pages/StatisticsPage.jsx'
import OrganizerEventDetailsPage from '../../features/dashboard/organizer/pages/OrganizerEventDetailsPage.jsx'
import PublicNotificationsPage from '../../features/public/pages/PublicNotificationsPage.jsx'
import AboutPage from '../../features/about/pages/AboutPage.jsx'
import FeedbackPage from '../../features/feedback/pages/FeedbackPage.jsx'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<GuestLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/events" element={<BrowseEventsPage />} />
          <Route path="/events/:id" element={<EventDetailsPage />} />
          <Route path="/search" element={<Navigate to="/events" replace />} />
          <Route path="/feedback" element={<FeedbackPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/public-notifications" element={<PublicNotificationsPage />} />
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
              <Route path="/organizer/statistics" element={<OrganizerStatisticsPage />} />
            </Route>
          </Route>

          <Route element={<RoleRoute allowedRoles={[ROLES.ADMIN]} />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/events" element={<AdminEventsPage />} />
              <Route path="/admin/events/:id/details" element={<OrganizerEventDetailsPage />} />
              <Route path="/admin/events/:id/attendees" element={<OrganizerAttendeesPage />} />
              <Route path="/admin/categories" element={<AdminCategoriesPage />} />
              <Route path="/admin/locations" element={<AdminLocationsPage />} />
              <Route path="/admin/reports" element={<AdminReportsPage />} />
              <Route path="/admin/notifications" element={<AdminNotificationsPage />} />
              <Route path="/admin/feedback" element={<AdminFeedbackPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
