const rawMode = String(import.meta.env.VITE_TEST_MODE || '').toLowerCase()

const forceOn = rawMode === 'true' || rawMode === '1'
const forceOff = rawMode === 'false' || rawMode === '0'

export const isTestMode = forceOn || (!forceOff && import.meta.env.DEV)
