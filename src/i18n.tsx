// 表示言語（英語／やさしい日本語）。漢字そのものの表示とは別
import { createContext, useContext } from 'react'

export type Language = 'en' | 'ja'

const en = {
  navPractice: 'Practice',
  navRecords: 'Records',
  navCredits: 'Credits',
  switchLanguage: 'やさしい にほんご',
  instruction: 'Find the same kanji.',
  stageFindOne: 'Find one',
  stageFindAll: 'Find all',
  stageQuickLook: 'Quick look',
  instructionFlash: 'Remember the kanji. It disappears soon, then choose the same one.',
  showTime: 'Showing time',
  instructionAll: 'Tap every kanji that is the same as the sample, then press Done.',
  done: 'Done',
  legendFound: 'Found',
  legendMissed: 'Missed',
  legendWrong: 'Wrong choice',
  sampleCorrect: 'Sample = correct',
  yourChoice: 'Your choice',
  next: 'Next',
  sessionComplete: 'Session complete',
  averageTime: 'Average time',
  seconds: 's',
  continue: 'Continue',
  recordsTitle: 'Your records',
  learningCount: 'Kanji you are practicing',
  noSessions: 'No sessions yet. Finish a 10-question session to see your progress.',
  chartTime: 'Average time per question (seconds)',
  chartCorrect: 'Correct answers (%)',
  session: 'Session',
  correctCount: 'Correct',
  deleteRecords: 'Delete records',
  confirmDelete: 'Delete all your records and start over?',
  introTitle: 'Welcome',
  introBody:
    'Look at the kanji at the top and tap the same one below. You do not need to know how to read it. Your records are saved only on this device. They are not shared with other devices.',
  introOk: 'Start',
  creditsTitle: 'Credits',
  creditsIntro: 'This app uses the following data and fonts. Thank you to their authors.',
  noticesLink: 'Full license texts',
}

export type Messages = typeof en

const ja: Messages = {
  navPractice: 'れんしゅう',
  navRecords: 'きろく',
  navCredits: 'しゅってん',
  switchLanguage: 'English',
  instruction: 'おなじ かんじを えらんで ください。',
  stageFindOne: '1つ さがす',
  stageFindAll: 'ぜんぶ さがす',
  stageQuickLook: 'いっしゅん みる',
  instructionFlash: 'かんじを おぼえて ください。すぐに きえます。そのあと おなじ かんじを えらんで ください。',
  showTime: 'みせる じかん',
  instructionAll: 'みほんと おなじ かんじを ぜんぶ えらんで、「できた」を おして ください。',
  done: 'できた',
  legendFound: 'みつけた',
  legendMissed: 'みおとし',
  legendWrong: 'ちがう じ',
  sampleCorrect: 'みほん（せいかい）',
  yourChoice: 'あなたが えらんだ じ',
  next: 'つぎへ',
  sessionComplete: 'おわりました',
  averageTime: 'へいきんの じかん',
  seconds: 'びょう',
  continue: 'つづける',
  recordsTitle: 'あなたの きろく',
  learningCount: 'いま れんしゅうしている かんじの かず',
  noSessions: 'まだ きろくが ありません。10もん とくと、ここに でます。',
  chartTime: '1もんの へいきんの じかん（びょう）',
  chartCorrect: 'せいかいの わりあい（%）',
  session: 'かい',
  correctCount: 'せいかい',
  deleteRecords: 'きろくを けす',
  confirmDelete: 'きろくを ぜんぶ けして、さいしょから はじめますか。',
  introTitle: 'ようこそ',
  introBody:
    'うえの かんじと おなじ かんじを、したから えらんで ください。よみかたは しらなくて だいじょうぶです。きろくは この きかいの なかにだけ のこります。ほかの きかいには ひきつがれません。',
  introOk: 'はじめる',
  creditsTitle: 'しゅってん',
  creditsIntro: 'この アプリは つぎの データと フォントを つかっています。',
  noticesLink: 'ライセンスの ぜんぶの ぶん',
}

export const messages: Record<Language, Messages> = { en, ja }

export const MessagesContext = createContext<Messages>(en)
export const useMessages = () => useContext(MessagesContext)
