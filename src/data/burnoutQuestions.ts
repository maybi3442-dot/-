import { BurnoutQuestion } from '../types';

export const BURNOUT_QUESTIONS: BurnoutQuestion[] = [
  {
    id: 1,
    question: '아침에 눈을 떠 학교에 출근할 생각을 하면 온몸이 무겁고 한숨부터 나온다.',
    category: 'exhaustion',
    categoryName: '정서적 고갈',
  },
  {
    id: 2,
    question: '하루 일과를 마치고 퇴근할 때쯤이면, 말 한마디 할 기운조차 남아있지 않다.',
    category: 'exhaustion',
    categoryName: '정서적 고갈',
  },
  {
    id: 3,
    question: '예전과 달리 아이들이나 학부모의 행동에 따뜻한 마음보다 귀찮음이나 냉소적인 감정이 먼저 든다.',
    category: 'depersonalization',
    categoryName: '거리두기 및 냉담화',
  },
  {
    id: 4,
    question: '아이들의 고민이나 어려움에 진심으로 깊이 공감해주기보다, 형식적으로만 대하게 된다.',
    category: 'depersonalization',
    categoryName: '거리두기 및 냉담화',
  },
  {
    id: 5,
    question: '내가 교사로서 아이들에게 실질적인 긍정적 영향을 주고 있다는 보람을 느끼지 못한다.',
    category: 'reducedAchievement',
    categoryName: '개인 성취감 저하',
  },
  {
    id: 6,
    question: '교실에서 문제가 생기면 "내가 부족해서, 내가 잘못 가르쳐서 그렇다"며 스스로를 자책한다.',
    category: 'reducedAchievement',
    categoryName: '개인 성취감 저하',
  },
  {
    id: 7,
    question: '학교에서 겪은 스트레스(민원, 학생 문제)가 퇴근 후나 주말에도 머릿속을 맴돌며 일상을 방해한다.',
    category: 'exhaustion',
    categoryName: '정서적 고갈',
  },
];

export const ANSWER_CHOICES = [
  { label: '전혀 그렇지 않다', score: 0 },
  { label: '드물게 그렇다 (월 1~2회)', score: 1 },
  { label: '가끔 그렇다 (주 1~2회)', score: 2 },
  { label: '자주 그렇다 (주 3~4회)', score: 3 },
  { label: '거의 매일 그렇다', score: 4 },
];
