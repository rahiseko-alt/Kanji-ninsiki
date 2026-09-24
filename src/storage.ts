// 練習記録を端末内（localStorage）に保存する（ADR-0002）。保存できない環境でも止まらない
import { initialRecord, restoreRecord, type PracticeRecord } from './practice/practice.ts'

const RECORD_KEY = 'kanji-ninsiki:record:v1'

export function loadRecord(): PracticeRecord {
  try {
    const raw = localStorage.getItem(RECORD_KEY)
    return raw === null ? initialRecord() : restoreRecord(JSON.parse(raw))
  } catch {
    return initialRecord()
  }
}

export function saveRecord(record: PracticeRecord): void {
  try {
    localStorage.setItem(RECORD_KEY, JSON.stringify(record))
  } catch {
    // 保存できなくても練習は続けられる
  }
}
