import { MockClient } from '@medplum/mock';
import { MedplumProvider } from '@medplum/react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import crypto from 'crypto';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { TextEncoder } from 'util';
import { SignInForm } from '@medplum/react';

const medplum = new MockClient();

describe('SignInPage', () => {
  function setup(url = '/signin'): void {
    render(
      <BrowserRouter>
        <MedplumProvider medplum={medplum}>
          <SignInForm>
          </SignInForm>
        </MedplumProvider>
      </BrowserRouter>
    );
  }

  beforeAll(() => {
    Object.defineProperty(global, 'TextEncoder', {
      value: TextEncoder,
    });

    Object.defineProperty(global.self, 'crypto', {
      value: crypto.webcrypto,
    });
  });

  test('Renders', async () => {
    setup();

    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  test('Success', async () => {
    setup();

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Email *'), { target: { value: 'admin@example.com' } });
    });

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Password *'), { target: { value: 'password' } });
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    });
  });
});