import { network } from 'hardhat'

export default (keys: string[], prefix: string): Record<string, string> => {
  console.info(`Network: ${network.name}`)
  const networkName = network.name.toUpperCase()
  const values: Record<string, string> = {}
  keys.forEach((key) => {
    const envKey = `${networkName}_${prefix}_${key}`
    const value = process.env[envKey]
    if (value) {
      console.info(`Found ${envKey} env var`)
      values[key] = value
    } else {
      throw new Error(`${envKey} env var is missing`)
    }
  })
  return values
}
