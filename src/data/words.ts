export type Word = {
  // 画面に表示する文字（漢字まじり）
  text: string
  // 読み（ひらがな）。ローマ字への変換はこちらを使う
  kana: string
}

export const WORDS: Word[] = [
  { text: '寿司', kana: 'すし' },
  { text: '東京タワー', kana: 'とうきょうたわー' },
  { text: '新幹線', kana: 'しんかんせん' },
  { text: 'お茶漬け', kana: 'おちゃづけ' },
  { text: '富士山', kana: 'ふじさん' },
  { text: '花火大会', kana: 'はなびたいかい' },
  { text: '自転車', kana: 'じてんしゃ' },
  { text: '一石二鳥', kana: 'いっせきにちょう' },
  { text: '図書館', kana: 'としょかん' },
  { text: '観覧車', kana: 'かんらんしゃ' },
]
