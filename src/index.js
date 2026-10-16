import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from 'react-router-dom';

const originalFetch = window.fetch;
window.fetch = async function(...args) {
  try {
    const response = await originalFetch.apply(this, args);
    const clonedResponse = response.clone();
    
    const contentType = clonedResponse.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      clonedResponse.json().then(data => {
        if (data && data.message === "Session expired") {
          window.location.href = "/";
        }
      }).catch(e => {
        // ignore JSON parse errors invisibly
      });
    }
    return response;
  } catch (error) {
    throw error;
  }
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true  }}>
      <App />
    </BrowserRouter>
  // </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
