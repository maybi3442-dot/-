export type CounselorId = 'senior_mentor' | 'psychologist' | 'rights_guardian';

export interface Counselor {
  id: CounselorId;
  name: string;
  roleTitle: string;
  tagline: string;
  avatarEmoji: string;
  accentColor: string;
  badgeText: string;
  description: string;
  welcomeMessage: string;
  specialties: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  counselorId?: CounselorId;
}

export interface TeacherProfile {
  name?: string;
  schoolLevel: '초등학교' | '중학교' | '고등학교' | '유치원' | '특수학교' | '기타';
  yearsOfService: '1~3년차 (신규·저경력)' | '4~10년차' | '10년 이상 (중견·수석)';
  roleType: '담임교사' | '교과/전담교사' | '부장/보직교사' | '기타';
}

export interface BurnoutQuestion {
  id: number;
  question: string;
  category: 'exhaustion' | 'depersonalization' | 'reducedAchievement';
  categoryName: string;
}

export interface BurnoutResult {
  score: number;
  totalMax: number;
  level: '안정' | '주의' | '경계' | '심각한 소진';
  exhaustionScore: number;
  depersonalizationScore: number;
  achievementScore: number;
  date: string;
  aiPrescription?: {
    letterTitle: string;
    warmLetter: string;
    prescriptions: Array<{ title: string; action: string }>;
    comfortQuote: string;
  };
}

export interface CommunicationTemplate {
  id: string;
  title: string;
  situation: string;
  defaultDraft: string;
  tips: string;
  category: '퇴근후연락' | '무리한요구' | '학생갈등' | '수업방해' | '평가이의';
}

export interface GratitudeEntry {
  id: string;
  date: string;
  content: string;
}
