import './App.css';
import { Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Homepage from './components/Homepage';
import PANPage from './Pages/PANPage';
import GetStartedPage from './Pages/GetStartedPage';
import DigiLockerLanding from './components/organism/DigiLockerLanding';
import DigiLockerSuccess from './components/organism/DigiLockerSuccess';
import DigiLockerFailed from './components/organism/DigiLockerFailed';
import BankVerification from './components/organism/BankVerification';
import IPV from './components/organism/IPV';
// import ComingSoon from './components/atom/ComingSoon';
import Profile from './components/organism/Profile';
import ExchangeSelection from './components/organism/ExchangeSelection';
import IPVVerify from './components/organism/IPVVerify';
import IPVMobile from './components/organism/IPVMobile';
import Signature from './components/organism/Signature';
import StepperHeader from './components/StepperHeader';
import Esign from './components/organism/Esign';
import EsignVerify from './components/organism/EsignVerify';
import ThankYou from './components/organism/ThankYou';
import { KycProvider } from './context/KycContext';

function App() {
  return (
    <KycProvider>
      <StepperHeader />
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/pan" element={<PANPage />} />
        <Route path="/get-started" element={<GetStartedPage />} />
        <Route path="/address" element={<DigiLockerLanding />} />
        <Route path="/digilocker-success" element={<DigiLockerSuccess />} />
        <Route path="/digilocker-failed" element={<DigiLockerFailed />} />
        <Route path="/bank-verification" element={<BankVerification />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/exchange" element={<ExchangeSelection />} />
        <Route path="/ipv" element={<IPV />} />
        <Route path="/ipv-verify" element={<IPVVerify />} />
        <Route path="/ipv-mobile" element={<IPVMobile />} />
        <Route path="/signature" element={<Signature />} />
        <Route path="/esign" element={<Esign />} />
        <Route path="/esign-verify" element={<EsignVerify />} />
        <Route path="/thank-you" element={<ThankYou />} />
      </Routes>
      <Toaster
        position="top-center"
        toastOptions={{ style: { width: "300px ", fontSize: "20px" } }}
      />
    </KycProvider>
  );
}

export default App;
