/** ミリ秒を秒の表記（小数1桁）にする */
export const formatSeconds = (ms: number): string => (ms / 1000).toFixed(1)
