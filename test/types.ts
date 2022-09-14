import type { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'

export interface Signer {
  address: string
  signer: SignerWithAddress
}

export interface Signers {
  owner: Signer
  user1: Signer
  user2: Signer
  user3: Signer
  user4: Signer
  user5: Signer
  user6: Signer
  user7: Signer
  user8: Signer
  user9: Signer
}
