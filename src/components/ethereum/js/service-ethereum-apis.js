'use strict';

(function closure(window) {
  var ETHERSCAN_API = 'https://api.etherscan.io/api';
  var RPC_URL = 'https://mainnet.infura.io/cdtFkBawVC1FHtisdhqm';

  if (typeof window.web3 !== 'undefined') {
    console.log('Using web3 detected from external source like Metamask');
    window.web3 = new window.Web3(window.web3.currentProvider);
  } else {
    console.log('Using web3 with Infura');
    window.web3 = new window.Web3(new window.Web3.providers.HttpProvider(RPC_URL));
  }

  window.angular.module('ethereum').service('EthereumApis', [
    '$q',
    '$window',
    '$http',
    'value',
    function($q, $window, $http, value) {
      var contractCache = {};
      return {
        getEthPrice: getEthPrice,
        getAddressBalance: getAddressBalance,
        getAddressTokenBalance: getAddressTokenBalance,
        getAddressTransactions: getAddressTransactions,
        getTxCount: getTxCount,
        getGasPrice: getGasPrice,
        getContract: getContract,
        resolveEnsName: resolveEnsName
      };

      function getEthPrice(displayCurrency) {
        displayCurrency = displayCurrency || value.getDisplayCurrency();
        return $http({
          method: 'GET',
          url: 'https://api.coinmarketcap.com/v2/ticker/1027/?convert=' + displayCurrency,
          withCredentials: false
        }).then(function(response) {
          return response.data.data.quotes[displayCurrency].price;
        });
      }

      function getAddressBalance(address) {
        return $http({
          method: 'GET',
          url: ETHERSCAN_API + '?module=account&action=balance&tag=latest&address=' + address,
          withCredentials: false
        }).then(function(res) {
          return Number(res.data.result) / 1000000000000000000;
        });
      }

      function getAddressTokenBalance(address, contractAddress, contractDecimals) {
        // special case for "ether" fake token
        if (contractAddress === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
          return getAddressBalance(address);
        }

        return $http({
          method: 'GET',
          url: ETHERSCAN_API + '?module=account&action=tokenbalance&contractaddress=' + contractAddress + '&address=' + address + '&tag=latest',
          withCredentials: false
        }).then(function(res) {
          return Number(res.data.result) / Math.pow(10, contractDecimals);
        });
      }

      function getAddressTransactions(address) {
        return $http({
          method: 'GET',
          url: ETHERSCAN_API + '?module=account&action=txlist&sort=desc&address=' + address,
          withCredentials: false
        }).then(function(res) {
          return res.data.result;
        });
      }

      function getTxCount(address) {
        return $q(function(resolve, reject) {
          $window.web3.eth.getTransactionCount(address, function(err, txCount) {
            if (err) {
              reject({
                code: 'ETH-API-03',
                message: 'Can\'t get transaction count for address ' + address
              });
            }
            resolve(txCount);
          });
        });
      }

      function getGasPrice() {
        return $http({
          method: 'GET',
          url: 'https://ethgasstation.info/json/ethgasAPI.json',
          withCredentials: false
        }).then(function(res) {
          return {
            safeLow: Math.ceil(res.data.safeLow / 10),
            average: Math.ceil(res.data.average / 10),
            fast: Math.ceil(res.data.fast / 10)
          };
        });
      }

      function getContract(address) {
        if (contractCache[address]) {
          return contractCache[address];
        }
        contractCache[address] = $http({
          method: 'GET',
          url: ETHERSCAN_API + '?module=contract&action=getabi&address=' + address,
          withCredentials: false
        }).then(function(response) {
          if (response.data.status === '1') {
            return JSON.parse(response.data.result);
          } else if (response.data.status === '0') {
            throw {
              code: 'ETH-API-01',
              message: 'Can\'t get contract ABI on etherscan. Maybe this contract\'s code is not verified.'
            };
          } else {
            throw {
              code: 'ETH-API-02',
              message: 'Can\'t reach Etherscan API.'
            };
          }
        }).then(function(abi) {
          return $window.web3.eth.contract(abi).at(address);
        });

        return contractCache[address];
      }

      function resolveEnsName(name) {
        return $window.ethers.providers.getDefaultProvider().resolveName(name);
      }
    }
  ]);
})(window);
