// ひらがな → ローマ字の変換と、入力の判定ロジック
//
// 考え方:
//   1. ひらがなを「入力の単位（チャンク）」に分ける（例: "しゃ" "っせ" "ん"）
//   2. チャンクごとに、受け付けるローマ字の候補を持たせる（例: しゃ → sha / sya / shixya ...）
//   3. 1キー入力するたびに、今の入力がどれかの候補の先頭と一致するかを調べる

// 1文字のかな。配列の先頭が画面に表示するお手本になる
const SINGLE: Record<string, string[]> = {
  あ: ['a'], い: ['i', 'yi'], う: ['u', 'wu', 'whu'], え: ['e'], お: ['o'],
  か: ['ka', 'ca'], き: ['ki'], く: ['ku', 'cu', 'qu'], け: ['ke'], こ: ['ko', 'co'],
  さ: ['sa'], し: ['shi', 'si', 'ci'], す: ['su'], せ: ['se', 'ce'], そ: ['so'],
  た: ['ta'], ち: ['chi', 'ti'], つ: ['tsu', 'tu'], て: ['te'], と: ['to'],
  な: ['na'], に: ['ni'], ぬ: ['nu'], ね: ['ne'], の: ['no'],
  は: ['ha'], ひ: ['hi'], ふ: ['fu', 'hu'], へ: ['he'], ほ: ['ho'],
  ま: ['ma'], み: ['mi'], む: ['mu'], め: ['me'], も: ['mo'],
  や: ['ya'], ゆ: ['yu'], よ: ['yo'],
  ら: ['ra'], り: ['ri'], る: ['ru'], れ: ['re'], ろ: ['ro'],
  わ: ['wa'], を: ['wo'],
  が: ['ga'], ぎ: ['gi'], ぐ: ['gu'], げ: ['ge'], ご: ['go'],
  ざ: ['za'], じ: ['ji', 'zi'], ず: ['zu'], ぜ: ['ze'], ぞ: ['zo'],
  だ: ['da'], ぢ: ['di'], づ: ['du'], で: ['de'], ど: ['do'],
  ば: ['ba'], び: ['bi'], ぶ: ['bu'], べ: ['be'], ぼ: ['bo'],
  ぱ: ['pa'], ぴ: ['pi'], ぷ: ['pu'], ぺ: ['pe'], ぽ: ['po'],
  ぁ: ['xa', 'la'], ぃ: ['xi', 'li'], ぅ: ['xu', 'lu'], ぇ: ['xe', 'le'], ぉ: ['xo', 'lo'],
  ゃ: ['xya', 'lya'], ゅ: ['xyu', 'lyu'], ょ: ['xyo', 'lyo'], ゎ: ['xwa', 'lwa'],
  っ: ['xtu', 'ltu', 'xtsu', 'ltsu'],
  ー: ['-'],
}

// 2文字のかな（拗音など）
const DOUBLE: Record<string, string[]> = {
  しゃ: ['sha', 'sya'], しゅ: ['shu', 'syu'], しぇ: ['she', 'sye'], しょ: ['sho', 'syo'],
  ちゃ: ['cha', 'tya', 'cya'], ちゅ: ['chu', 'tyu', 'cyu'], ちぇ: ['che', 'tye', 'cye'], ちょ: ['cho', 'tyo', 'cyo'],
  じゃ: ['ja', 'zya', 'jya'], じゅ: ['ju', 'zyu', 'jyu'], じぇ: ['je', 'zye', 'jye'], じょ: ['jo', 'zyo', 'jyo'],
  ふぁ: ['fa'], ふぃ: ['fi'], ふぇ: ['fe'], ふぉ: ['fo'], ふゅ: ['fyu'],
  てぃ: ['thi'], でぃ: ['dhi'], でゅ: ['dhu'], とぅ: ['twu'], どぅ: ['dwu'],
  うぃ: ['wi'], うぇ: ['we'],
}

// き → kya / kyu / kyo のように規則的に作れる拗音
const YOUON_ROWS: Record<string, string> = {
  き: 'k', ぎ: 'g', に: 'n', ひ: 'h', び: 'b', ぴ: 'p', み: 'm', り: 'r', ぢ: 'd',
}
for (const [kana, consonant] of Object.entries(YOUON_ROWS)) {
  DOUBLE[kana + 'ゃ'] = [consonant + 'ya']
  DOUBLE[kana + 'ゅ'] = [consonant + 'yu']
  DOUBLE[kana + 'ょ'] = [consonant + 'yo']
}

export type Chunk = {
  kana: string
  candidates: string[]
}

const singleCandidates = (char: string) => SINGLE[char] ?? [char]

// ひらがなの文字列を、入力の単位（チャンク）に分ける
export function toChunks(kana: string): Chunk[] {
  // まずは「1文字」か「拗音などの2文字」に分ける
  const units: Chunk[] = []
  for (let i = 0; i < kana.length; i++) {
    const pair = kana.slice(i, i + 2)
    if (pair.length === 2 && DOUBLE[pair]) {
      // "きゃ" は "kya" のほかに "ki" + "xya" のような分割入力も受け付ける
      const split = singleCandidates(pair[0]).flatMap((a) =>
        singleCandidates(pair[1]).map((b) => a + b),
      )
      units.push({ kana: pair, candidates: [...DOUBLE[pair], ...split] })
      i++
    } else {
      units.push({ kana: kana[i], candidates: singleCandidates(kana[i]) })
    }
  }

  // 「っ」と「ん」は後ろの文字によって候補が変わるので、後ろから順に組み立てる
  const chunks: Chunk[] = []
  for (let i = units.length - 1; i >= 0; i--) {
    const unit = units[i]
    const next = chunks[0]

    if (unit.kana === 'っ' && next) {
      // 「っ」+ 次の文字をまとめて1チャンクにする（例: "っせ" → "sse" / "xtuse"）
      const doubled = next.candidates
        .filter((c) => /^[bcdfghjklmpqrstvwxyz]/.test(c))
        .flatMap((c) => (c.startsWith('ch') ? [c[0] + c, 't' + c] : [c[0] + c]))
      const separate = unit.candidates.flatMap((t) => next.candidates.map((c) => t + c))
      chunks[0] = { kana: unit.kana + next.kana, candidates: [...doubled, ...separate] }
      continue
    }

    if (unit.kana === 'ん') {
      // 次が母音・や行・な行でなければ "n" 1回でもよい（例: "かんじ" → "kanji"）
      const canSingleN =
        next !== undefined && !next.candidates.some((c) => /^[aiueoyn]/.test(c))
      chunks.unshift({
        kana: 'ん',
        candidates: canSingleN ? ['n', 'nn', 'xn'] : ['nn', 'xn'],
      })
      continue
    }

    chunks.unshift(unit)
  }
  return chunks
}

export type TypingState = {
  chunks: Chunk[]
  // 今入力中のチャンクの位置
  index: number
  // 今のチャンクで入力済みの文字
  buffer: string
  // これまでに正しく入力したローマ字すべて
  typed: string
}

export function createTypingState(kana: string): TypingState {
  return { chunks: toChunks(kana), index: 0, buffer: '', typed: '' }
}

export function isFinished(state: TypingState): boolean {
  return state.index >= state.chunks.length
}

// 1キー入力する。正しいキーなら ok: true と新しい状態を返す
export function inputKey(
  state: TypingState,
  key: string,
): { state: TypingState; ok: boolean } {
  const chunk = state.chunks[state.index]
  if (!chunk) return { state, ok: false }

  const next = state.buffer + key
  if (chunk.candidates.some((c) => c.startsWith(next))) {
    // 候補と完全に一致し、それより長い候補がなければチャンク完了
    const completed =
      chunk.candidates.includes(next) &&
      !chunk.candidates.some((c) => c.length > next.length && c.startsWith(next))
    return {
      state: {
        ...state,
        index: completed ? state.index + 1 : state.index,
        buffer: completed ? '' : next,
        typed: state.typed + key,
      },
      ok: true,
    }
  }

  // "n" を打った時点で「ん」は成立しているが "nn" の可能性があるので保留していた場合、
  // 次のキーは次のチャンクの入力として扱う（例: "kanj" の "j"）
  if (state.buffer !== '' && chunk.candidates.includes(state.buffer)) {
    return inputKey({ ...state, index: state.index + 1, buffer: '' }, key)
  }

  return { state, ok: false }
}

// 画面表示用: 入力済みのローマ字と、残りのお手本
export function getRomajiGuide(state: TypingState): { typed: string; rest: string } {
  const current = state.chunks[state.index]
  const currentRest = current
    ? (current.candidates.find((c) => c.startsWith(state.buffer)) ?? '').slice(
        state.buffer.length,
      )
    : ''
  const following = state.chunks
    .slice(state.index + 1)
    .map((c) => c.candidates[0])
    .join('')
  return { typed: state.typed, rest: currentRest + following }
}

// 画面表示用: 入力済みのかなと、残りのかな（チャンク単位で進む）
export function getKanaProgress(state: TypingState): { typed: string; rest: string } {
  const kanaOf = (chunks: Chunk[]) => chunks.map((c) => c.kana).join('')
  return {
    typed: kanaOf(state.chunks.slice(0, state.index)),
    rest: kanaOf(state.chunks.slice(state.index)),
  }
}
