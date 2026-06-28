export const APP_NAME = 'ExamAI Pro';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  DASHBOARD: '/dashboard',
  EXAMS: '/exams',
  EXAM_DETAIL: '/exams/:id',
  EXAM_TAKE: '/exams/:id/take',
  EXAM_RESULTS: '/exams/:id/results',
  ANALYTICS: '/analytics',
  ADMIN: '/admin',
  FACULTY: '/faculty',
  STUDENT: '/student',
  DEVELOPER: '/developer',
  INSTITUTION: '/institution',
  SETTINGS: '/settings',
  PROFILE: '/profile',
  NOTIFICATIONS: '/notifications',
  AI_CHAT: '/ai-chat',
  QUESTION_BANK: '/question-bank',
  PROCTOR: '/proctor',
  ROADMAPS: '/roadmaps',
  LEARNING: '/learning',
  PROGRESS: '/progress',
  PLANNER: '/planner',
} as const;

export const COLLECTIONS = {
  USERS: 'users',
  EXAMS: 'exams',
  QUESTIONS: 'questions',
  RESULTS: 'results',
  INSTITUTIONS: 'institutions',
  NOTIFICATIONS: 'notifications',
  ANALYTICS: 'analytics',
  ROADMAPS: 'roadmaps',
  LEARNING_PATHS: 'learningPaths',
  AI_SESSIONS: 'aiSessions',
  QUESTION_BANK: 'questionBank',
} as const;

export const LOCAL_STORAGE_KEYS = {
  AUTH_TOKEN: 'examai_auth_token',
  USER_DATA: 'examai_user_data',
  THEME: 'examai_theme',
  LANGUAGE: 'examai_language',
  LAST_ROUTE: 'examai_last_route',
  OFFLINE_DATA: 'examai_offline_data',
} as const;

export const FIREBASE_ERRORS: Record<string, string> = {
  'auth/invalid-credential': 'Invalid email or password',
  'auth/user-not-found': 'No account found with this email',
  'auth/wrong-password': 'Incorrect password',
  'auth/email-already-in-use': 'An account with this email already exists',
  'auth/weak-password': 'Password is too weak',
  'auth/invalid-email': 'Invalid email address',
  'auth/requires-recent-login': 'Please log in again to continue',
  'auth/too-many-requests': 'Too many attempts. Please try again later.',
  'auth/network-request-failed': 'Network error. Please check your connection.',
  'permission-denied': 'You do not have permission to perform this action',
  'not-found': 'The requested resource was not found',
  'resource-exhausted': 'Service temporarily unavailable. Please try again later.',
};

export const AI_CONFIG = {
  MAX_TOKENS: 8192,
  TEMPERATURE: 0.7,
  TOP_P: 0.95,
  TOP_K: 40,
  TIMEOUT_MS: 30000,
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000,
} as const;

export const EXAM_CONFIG = {
  MAX_QUESTIONS_PER_EXAM: 200,
  MIN_QUESTIONS_PER_EXAM: 1,
  DEFAULT_TIME_LIMIT_MINUTES: 60,
  MAX_TIME_LIMIT_MINUTES: 480,
  PASSING_SCORE: 60,
} as const;

export const FILE_CONFIG = {
  MAX_FILE_SIZE_MB: 10,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
} as const;

export const QUERY_KEYS = {
  AUTH: 'auth',
  USER: 'user',
  EXAMS: 'exams',
  EXAM: 'exam',
  QUESTIONS: 'questions',
  RESULTS: 'results',
  ANALYTICS: 'analytics',
  NOTIFICATIONS: 'notifications',
  INSTITUTION: 'institution',
  ROADMAPS: 'roadmaps',
  LEARNING_PATHS: 'learningPaths',
  AI_SESSIONS: 'aiSessions',
} as const;
