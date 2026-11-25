import React, { lazy } from 'react';
import { ROUTES } from '../../config/routes';

const LoginPage = lazy(() => import('./LoginPage'));
const RegisterPage = lazy(() => import('./RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./ResetPasswordPage'));
const VerifyEmailPage = lazy(() => import('./VerifyEmailPage'));

export default {
  layout: 'public',
  routes: [
    {
      path: ROUTES.LOGIN,
      element: <LoginPage />,
    },
    {
      path: ROUTES.REGISTER,
      element: <RegisterPage />,
    },
    {
      path: ROUTES.FORGOT_PASSWORD,
      element: <ForgotPasswordPage />,
    },
    {
      path: ROUTES.RESET_PASSWORD,
      element: <ResetPasswordPage />,
    },
    {
      path: ROUTES.VERIFY_EMAIL,
      element: <VerifyEmailPage />,
    },
  ],
};
