import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/chrome-extension';
import Popup from './Popup';
import './index.css';

const CLERK_PUBLISHABLE_KEY = "pk_test_bmV3LW1hcmxpbi01Ni5jbGVyay5hY2NvdW50cy5kZXYk";

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key");
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <Popup />
    </ClerkProvider>
  </React.StrictMode>
);
