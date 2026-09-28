import { Counselor } from '../types';

export const COUNSELORS: Record<string, Counselor> = {
  senior_mentor: {
    id: 'senior_mentor',
    name: '라온 쌤',
    roleTitle: '15년 차 온화한 수석교사',
    tagline: '선생님 잘못이 아니에요. 차 한잔 하시며 털어놓으세요.',
    avatarEmoji: '🌿',
    accentColor: 'emerald',
    badgeText: '따뜻한 공감 & 교직 멘토링',
    description: '교실에서 겪는 눈물과 무력감을 누구보다 잘 이해하는 선배 교사입니다. 자책하지 않도록 품어주고 현장의 지혜를 나눕니다.',
    welcomeMessage: '선생님, 오늘 하루도 교실에서 아이들과 치열하게 부대끼느라 정말 애쓰셨습니다.\n\n혼자 삭이느라 가슴이 답답하고 목이 메이지는 않으셨나요? 교직이라는 자리가 때로는 너무 외롭고 무겁지요.\n\n선생님 잘못이 아니니, 오늘 있었던 속상한 일이나 마음에 맺힌 이야기를 편하게 꺼내놓으세요. 제가 가만히 들어드릴게요.',
    specialties: ['학급 경영 & 학생 지도 고충', '신규 및 저경력 교사 멘토링', '자책감 완화 & 마음 품어주기', '동료·관리자와의 관계 고민'],
  },
  psychologist: {
    id: 'psychologist',
    name: '소원 상담사',
    roleTitle: '교사 전문 심리치료사',
    tagline: '바닥난 마음 에너지, 지금은 선생님 자신을 돌볼 시간입니다.',
    avatarEmoji: '☕',
    accentColor: 'amber',
    badgeText: '번아웃 & 정서 소진 케어',
    description: '교사의 과각성 상태와 감정 노동을 치유합니다. 깊은 호흡, 자기자비(Self-Compassion), 억눌린 감정 수용을 돕습니다.',
    welcomeMessage: '선생님, 반갑습니다. 하루 종일 수십 명의 아이들을 챙기고 긴장 속에서 학부모 연락을 기다리느라 몸과 마음이 굳어있지 않으신가요?\n\n불안과 무기력감, 혹은 불쑥 솟아오르는 분노는 선생님이 나약해서가 아니라 몸이 보내는 "더 이상은 쉬어야 해"라는 절박한 신호입니다.\n\n지금 어떤 감정이 가장 무겁게 느껴지시나요? 평가나 판단 없이 있는 그대로 안아드리겠습니다.',
    specialties: ['교사 번아웃 & 만성 피로', '퇴근 후 불안 & 불면증 완화', '감정 정당화 & 수용 훈련', '자기 자비(Self-Compassion) 회복'],
  },
  rights_guardian: {
    id: 'rights_guardian',
    name: '한결 멘토',
    roleTitle: '교권 보호 & 갈등 대처 멘토',
    tagline: '부당한 민원과 위협에 혼자 떨지 마세요. 단단한 방패가 되어드립니다.',
    avatarEmoji: '🛡️',
    accentColor: 'sky',
    badgeText: '악성 민원 & 교권 보호 솔루션',
    description: '학부모 폭언, 아동학대 의심 신고 불안, 학생 생활지도 거부 등 위기 상황에서 침착하고 합법적인 대응책을 제시합니다.',
    welcomeMessage: '선생님, 당황스럽고 두려운 상황을 마주하셨군요. 심장이 쿵쾅거리고 억울해서 손이 떨리실 수도 있습니다.\n\n선생님은 학부모의 감정 쓰레기통이 아니며, 부당한 대우를 견뎌야 할 의무도 없습니다. 혼자서 모든 비난을 감당하려 하지 마세요.\n\n어떤 말이나 행동으로 곤란을 겪고 계신가요? 관리자 보고, 상담 일지 기록, 공식 절차를 통해 선생님을 지켜낼 수 있는 최선의 방안을 함께 찾겠습니다.',
    specialties: ['학부모 부당 민원 & 폭언 대응', '교원보호위원회 절차 및 조언', '퇴근 후 연락 경계선 설정', '객관적 상담 일지 & 증거 기록법'],
  },
};

export const QUICK_TOPICS = [
  {
    counselorId: 'senior_mentor',
    label: '내가 무능한 교사 같아요',
    prompt: '요즘 들어 제가 아이들을 잘 가르치지도 못하고 학급 통제도 못하는 무능한 교사라는 자책감이 자꾸 들어요...',
  },
  {
    counselorId: 'rights_guardian',
    label: '학부모님의 거친 항의와 민원',
    prompt: '오늘 학부모님께서 아이 생활지도와 관련해 납득하기 어려운 억지 요구를 하시며 거칠게 항의하셨어요. 심장이 떨려요.',
  },
  {
    counselorId: 'psychologist',
    label: '퇴근 후에도 알림 공포증',
    prompt: '퇴근 후 집에서도 휴대폰 진동이나 카톡 알림만 울리면 가슴이 철렁 내려앉고 불안해서 쉴 수가 없어요.',
  },
  {
    counselorId: 'senior_mentor',
    label: '수업 방해 학생 지도 막막함',
    prompt: '수업 시간에 계속 소리를 지르고 다른 친구들을 괴롭히는 아이가 있는데, 아무리 타일러도 듣지 않아 눈물이 날 것 같아요.',
  },
  {
    counselorId: 'psychologist',
    label: '끝없는 행정 공문과 회의감',
    prompt: '아이들과 교감하고 수업 연구를 하고 싶은데, 끝없이 밀려오는 행정 공문과 잡무에 치여 교직에 대한 회의감이 너무 큽니다.',
  },
];
