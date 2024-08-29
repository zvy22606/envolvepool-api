import { Contract, ethers, parseUnits } from 'ethers'
import { StandardMerkleTree } from '@openzeppelin/merkle-tree'
import { LaunchProject, UserFuelStake } from '@prisma/client'
import AirdropAbi from '../lib/abi/Airdrop.json'
import launchapTokenAbi from '../lib/abi/LaunchapToken.json'
import stakingTokenAbi from '../lib/abi/StakingToken.json'
import launchpadAbi from '../lib/abi/Launchpad.json'

class LaunchPoolThirdparty {
  private privateKey: string = process.env.FAUCET_OWNER_PRIVATE_KEY!
  private launchapTokenAddress: string =
    '0x8d3b53f80DaCa5EBe21dFD0ec974d2951be4ECBA'
  private stakingTokenAddress: string =
    '0x3d416A9fa13A84b984C16d52Fb005FC26892ED10'
  private launchpadAddress: string =
    '0xF67b9e899A9B8f1Ea66E27AB6B7AEF9f05844CCC'
  private airdropAddress: string = '0x4DeAf2E4eCbAEafff5E6243DBd11b5737bc7084A'
  private chainID: bigint = 656476n
  private launchapToken: Contract
  private stakingToken: Contract
  private launchpad: Contract
  private airdrop: Contract
  private owner: string

  constructor() {
    const provider = new ethers.JsonRpcProvider(
      'https://rpc.open-campus-codex.gelato.digital'
    )

    // 使用私钥连接到账户
    // const privateKey: string =
    // '0x25224593eca838cb732ffba2f6af3ef31d6d5d2bdc99cf4fe51db074e39bb68e'
    const wallet = new ethers.Wallet(this.privateKey, provider)

    this.launchapToken = new ethers.Contract(
      this.launchapTokenAddress,
      launchapTokenAbi,
      wallet
    )
    this.stakingToken = new ethers.Contract(
      this.stakingTokenAddress,
      stakingTokenAbi,
      wallet
    )
    this.launchpad = new ethers.Contract(
      this.launchpadAddress,
      launchpadAbi,
      wallet
    )
    this.airdrop = new ethers.Contract(this.airdropAddress, AirdropAbi, wallet)
    this.owner = wallet.address
  }
  async addLaunchPool(project: LaunchProject): Promise<any> {
    const _name: string = project.name
    const _startTime: number = Math.floor(project.fuelStart.valueOf() / 1000)
    const _endTime: number = Math.floor(project.airdropEnd.valueOf() / 1000)
    const _LowStakingAmount: bigint = parseUnits('0.0001', 18)
    const totalAllocation: bigint = parseUnits('1000', 18)

    return this.launchpad.addLaunchpad(
      _name,
      this.stakingTokenAddress,
      this.launchapTokenAddress,
      _startTime,
      _endTime,
      this.chainID,
      this.launchpadAddress,
      this.launchapTokenAddress,
      _LowStakingAmount,
      totalAllocation
    )
  }

  async addAirDrop(project: LaunchProject, stakes: UserFuelStake[]) {
    const _startTime: number = Math.floor(project.fuelStart.valueOf() / 1000)
    const _endTime: number = Math.floor(project.airdropEnd.valueOf() / 1000)

    // const values: any[][] = [
    //   ['0x1f8144fa7396EA2b416453303d434e9D9a685333', 100000000000000n],
    //   ['0x1f8144fa7396EA2b416453303d434e9D9a685333', 100000000000000n]
    // ]
    const values: any[][] = []
    stakes.forEach((stake) => {
      values.push([stake.userAddress, BigInt(stake.amount.valueOf())])
    })
    const tree = StandardMerkleTree.of(values, ['address', 'uint256'])
    await this.airdrop.addTokenAirDrop(
      this.launchapTokenAddress,
      tree.root,
      _startTime,
      _endTime
    )

    return tree.getProof(0)
  }

  async claimToken(proof: string[], amount: number) {
    return this.airdrop.claim(this.launchapTokenAddress, proof, amount)
  }
}

export default new LaunchPoolThirdparty()
