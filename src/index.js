import React from 'react';
import ReactDOM from 'react-dom';
import { createHashRouter, RouterProvider } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './redux/store';

import App from './App';
import './index.css';
import ErrorBoundary from './components/LoginConsent/Error/ErrorBoundary';
import { ThemeProvider } from '@mui/material/styles';
import { mainTheme } from './themes/main';

const router = createHashRouter([
  {
    path: "/",
    element: <App />
  }
]);

document.addEventListener('DOMContentLoaded', () => {
  ReactDOM.render(
    <Provider store={store}>
      <ThemeProvider theme={mainTheme}>
        <ErrorBoundary>
          <RouterProvider router={router} />
        </ErrorBoundary>
      </ThemeProvider>
    </Provider>,
    document.getElementById('app')
  );
});