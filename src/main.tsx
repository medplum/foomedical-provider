import { MantineProvider, MantineThemeOverride } from '@mantine/core';
import { NotificationsProvider } from '@mantine/notifications';
import { MedplumClient } from '@medplum/core';
import { MedplumProvider } from '@medplum/react';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';

const medplum = new MedplumClient({
  onUnauthenticated: () => (window.location.href = '/'),
  // baseUrl: 'http://localhost:8103/', // Uncomment this to run against the server on your localhost
});

const theme: MantineThemeOverride = {
  primaryColor: 'teal',
  primaryShade: 9,
};

const container = document.getElementById('root') as HTMLDivElement;
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <MedplumProvider medplum={medplum}>
        <MantineProvider theme={theme} withGlobalStyles withNormalizeCSS>
          <NotificationsProvider position="bottom-right">
            <App />
          </NotificationsProvider>
        </MantineProvider>
      </MedplumProvider>
    </BrowserRouter>
  </React.StrictMode>
);
