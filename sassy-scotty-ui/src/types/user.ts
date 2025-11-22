export interface UserProfile {
  id: string;
  name: string;
  email: string;
  accessCode: string;
  canvasApiKey?: string; // User's personal Canvas API key
  deviceInfo: DeviceInfo;
  firstAccess: string;
  lastAccess: string;
  preferences?: UserPreferences;
}

export interface DeviceInfo {
  userAgent: string;
  platform: string;
  browser: string;
  os: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  screenResolution: string;
  timezone: string;
}

export interface UserPreferences {
  theme?: string;
  selectedCourses?: string[];
  notifications?: boolean;
}

export interface AccessLog {
  userId: string;
  timestamp: string;
  deviceInfo: DeviceInfo;
  ipAddress?: string;
}
