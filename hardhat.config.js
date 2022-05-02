require('@nomiclabs/hardhat-waffle')
require('@nomiclabs/hardhat-etherscan')

module.exports = {
  solidity: '0.8.9',
  networks: {
    hardhat: {},
    bsctestnet: {
      url: 'https://data-seed-prebsc-1-s2.binance.org:8545/',
      accounts: [
        '838cbcc0b4ca1819402a1eed595d4b927412bce897525870f3738eb13897c09e'
      ]
    }
  },
  etherscan: {
    apiKey: {
      bscTestnet: 'SPJX6AEPAUIW9GYBDHEEDFGETUDNZDQZE9'
    }
  }
}
