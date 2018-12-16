import Config from '../../modules/config/server';

async function getTopERC20List() {
  return new Promise(async (resolve, reject) => {
    try {
      HTTP.call('GET', `http://api.ethplorer.io/getTop?apiKey=${await Config.getEthplorerAPIKey()}`, {}, (error, response) => {
        if(!error) {
          resolve(response.data.tokens)
        } else {
          reject(error)
        }
      })
    } catch(e) {
      reject(e)
    }
  })
}

async function getCryptosPrice(tokenSymbols) { //comma seperated symbols
  return new Promise(async (resolve, reject) => {
    try {
      HTTP.call('GET', `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${tokenSymbols}`, {
      headers: {
        "X-CMC_PRO_API_KEY": (await Config.getCoinmarketcapAPIKey())
      }
    }, (error, response) => {
      console.log(error, response)
      if(!error) {
        resolve(response)
      } else {
        reject(error)
      }
    })
    } catch(e) {
      reject(e)
    }
  })
}

async function getTokenInfoFromAddress(address) {
  return new Promise(async (resolve, reject) => {
    try {
      HTTP.call('GET', `http://api.ethplorer.io/getTokenInfo?address=${address}&apiKey=${await Config.getEthplorerAPIKey()}`, {}, (error, response) => {
        if(!error) {
          resolve(response.data)
        } else {
          reject(error)
        }
      })
    } catch(e) {
      reject(e)
    }
  })
}

export {
  getTopERC20List,
  getCryptosPrice,
  getTokenInfoFromAddress
}