# Kingsland-Blockchain-Advanced-Project

<h2> Node Instructions</h2>
Checkout code to a local repository, ensure you have all dependencies installed by running npm install<BR>

Then to run the Node run the following command from the Node directory:<BR><BR>
<i>node node.js host port</i><br><BR>
where host is the host, eg localhost, and port is the port number, eg 7777<br><BR>
With no extra parameters, the node will start at localhost:5555 by default<BR><br>
All API endpoints are as per the definition in the 'REST API for Practical Project' document

<h2> Wallet Instructions </h2>
The Wallet App for this project is a purely client-side web application. All the computations and and logic happen in the browser.
The wallet app is a Hierarchical Deterministic(HD) wallet. The heart of the wallet app can be found [here](https://github.com/pappas999/Kingsland-Blockchain-Advanced-Project/blob/master/Wallet/libs/walletApp.js).

<h3> Wallet Operations
1. To open the wallet application, just open the `index.html` file inside the `Wallet` directory using your browser. For best experience, Google Chrome is recommended.
2. On the app, you could create a new wallet by clicking the Create Wallet. You will also be asked by a password to create a new wallet. Once you submit the form, the app wiill create a new wallet and will give you your wallet mnemonic. Please save this mnemonic!
3. There is also an option to Open an existing wallet, just enter your password and mnemonic and submit.
4. Just in case you forgot your mnemonic, there is also an option to view your existing mnemonic.
5. There is also a tab to view your wallet addresses and balances. You will have 5 addresses and balances.
6. You could also send transactions (create, sign and send to blockchain node)
7. And lastly, you could logout of your wallet and your wallet instance will be cleared on the browser.


<h2> Faucet Instructions</h2>
The Faucet application is an Express/Node JS web app. Thisfaucet will give your wallet some coins to use.

<h3> Setup </h3>
In the Faucet directory, run <i>npm install</i> to install the dependencies.

<h3> Running the Faucet App
1. Once the dependencies are installed the following command:
```
npm start
```

2. Go to your browser, and access `http://localhost:3000`.

3. Fill up the form (your address, blockchain node, and captcha) and click submit. The faucet will give you a random number of coins between 0.5 coin (500000 microcoins) to 1 coin (1000000 microcoins)

4. You can only request from the faucet app once every one hour.
