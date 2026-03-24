const CHOSUNG = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ',
  'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
]

function getChosung(char: string): string {
  const code = char.charCodeAt(0)
  if (code < 0xAC00 || code > 0xD7A3) return char
  const index = Math.floor((code - 0xAC00) / 588)
  return CHOSUNG[index]
}

function extractChosung(str: string): string {
  return [...str].map(getChosung).join('')
}

function isChosung(char: string): boolean {
  return CHOSUNG.includes(char)
}

export function matchesSearch(query: string, name: string, group: string): boolean {
  const q = query.toLowerCase().trim()
  if (!q) return true

  const nameLower = name.toLowerCase()
  const groupLower = group.toLowerCase()

  // Direct substring match
  if (nameLower.includes(q) || groupLower.includes(q)) return true

  // Chosung match (only if query is all chosung)
  const allChosung = [...q].every(isChosung)
  if (allChosung) {
    const nameChosung = extractChosung(name)
    const groupChosung = extractChosung(group)
    if (nameChosung.includes(q) || groupChosung.includes(q)) return true
  }

  return false
}
