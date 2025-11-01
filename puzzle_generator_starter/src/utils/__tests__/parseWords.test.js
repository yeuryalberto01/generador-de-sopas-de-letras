import { parseWords, validateWord, findDuplicates } from '../parseWords'

describe('parseWords', () => {
  test('debe parsear palabras separadas por comas', () => {
    const result = parseWords('palo, piedra, papel')
    expect(result.words).toEqual(['palo', 'piedra', 'papel'])
    expect(result.valid).toBe(true)
  })

  test('debe parsear palabras separadas por saltos de línea', () => {
    const result = parseWords('palo\npiedra\npapel')
    expect(result.words).toEqual(['palo', 'piedra', 'papel'])
    expect(result.valid).toBe(true)
  })

  test('debe parsear palabras separadas por punto y coma', () => {
    const result = parseWords('palo;piedra;papel')
    expect(result.words).toEqual(['palo', 'piedra', 'papel'])
    expect(result.valid).toBe(true)
  })

  test('debe ignorar duplicados case-insensitive', () => {
    const result = parseWords('Palo, palo, PALO')
    expect(result.words).toEqual(['Palo'])
    expect(result.duplicates).toEqual(['palo', 'PALO'])
    expect(result.valid).toBe(true)
  })

  test('debe ignorar espacios vacíos', () => {
    const result = parseWords('palo,  , piedra, , papel')
    expect(result.words).toEqual(['palo', 'piedra', 'papel'])
    expect(result.valid).toBe(true)
  })

  test('debe rechazar palabras inválidas', () => {
    const result = parseWords('a, palabra-demasiado-larga-para-ser-aceptada, ok')
    expect(result.words).toEqual(['ok'])
    expect(result.valid).toBe(false)
  })

  test('debe aceptar palabras con tildes y ñ', () => {
    const result = parseWords('canción, ñandú, árbol')
    expect(result.words).toEqual(['canción', 'ñandú', 'árbol'])
    expect(result.valid).toBe(true)
  })

  test('debe aceptar palabras con números y guiones', () => {
    const result = parseWords('word2, sub-rayado, guión')
    expect(result.words).toEqual(['word2', 'sub-rayado', 'guión'])
    expect(result.valid).toBe(true)
  })
})

describe('validateWord', () => {
  test('debe validar palabra correcta', () => {
    const result = validateWord('palabra')
    expect(result.valid).toBe(true)
  })

  test('debe rechazar palabra demasiado corta', () => {
    const result = validateWord('a')
    expect(result.valid).toBe(false)
  })

  test('debe rechazar palabra demasiado larga', () => {
    const result = validateWord('palabra-demasiado-larga-para-ser-valida')
    expect(result.valid).toBe(false)
  })

  test('debe rechazar caracteres especiales', () => {
    const result = validateWord('palabra!')
    expect(result.valid).toBe(false)
  })
})

describe('findDuplicates', () => {
  test('debe encontrar duplicados case-insensitive', () => {
    const duplicates = findDuplicates(['Palo', 'palo', 'Piedra', 'piedra'])
    expect(duplicates).toEqual(['palo', 'piedra'])
  })

  test('debe retornar array vacío sin duplicados', () => {
    const duplicates = findDuplicates(['palo', 'piedra', 'papel'])
    expect(duplicates).toEqual([])
  })
})