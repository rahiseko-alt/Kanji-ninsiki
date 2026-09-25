import generated from './generated/kanji-data.json'
import type { KanjiData } from './data/buildKanjiData.ts'

// JSON の読み込みでは部品の組（[string, string]）が string[] と推論されるため、型を当てる。
// 中身の条件は src/data/kanjiData.test.ts が作成元で確かめている
export const kanjiData = generated as unknown as KanjiData
