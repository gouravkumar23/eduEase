// Components
export { default as Auth } from './components/Auth';
export { default as OTPModal } from './components/OTPModal';
export { default as VerifyLinkHandler } from './components/VerifyLinkHandler';
export { default as PublicProfile } from './components/PublicProfile';
export { default as RoleGuard } from './components/RoleGuard';

// Contexts
export { AuthProvider, useAuth } from './contexts/AuthContext';
export type { User } from './contexts/AuthContext';

// Utils
export { generateOTP, hashOTP, isExpired } from './utils/otp';
export { templates } from './utils/emailTemplates';


export default type