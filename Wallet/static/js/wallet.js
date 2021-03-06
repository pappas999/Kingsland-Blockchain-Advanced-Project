$(document).ready(function () {

    let wallets = {};

    $("#infoBox").hide();
    $("#errorBox").hide();
    hideLoadingBar();

    showView("viewHome");

    $('#linkHome').click(function () {
        showView("viewHome");
        $('.nav-item').removeClass('active');
        $(this).parent().addClass("active");
    });

    $('#linkCreateNewWallet').click(function () {
        $('#passwordCreateWallet').val('');
        $('#textareaCreateWalletResult').val('');
        showView("viewCreateNewWallet");
        $('.nav-item').removeClass('active');
        $(this).parent().addClass("active");
    });

    $('#linkImportWalletFromMnemonic').click(function () {
        $('#textareaOpenWallet').val('');
        $('#passwordOpenWallet').val('');
        $('#textareaOpenWalletResult').val('');
        showView("viewOpenWalletFromMnemonic");
        $('.nav-item').removeClass('active');
        $(this).parent().addClass("active");
    });

    $('#linkShowMnemonic').click(function () {
        $('#passwordShowMnemonic').val('');
        showView("viewShowMnemonic");
        $('.nav-item').removeClass('active');
        $(this).parent().addClass("active");
    });

    $('#linkShowAddressesAndBalances').click(function () {
        $('#passwordShowAddresses').val('');
        $('#divAddressesAndBalances').empty();
        showView("viewShowAddressesAndBalances");
        $('.nav-item').removeClass('active');
        $(this).parent().addClass("active");
    });

    $('#linkSendTransaction').click(function () {
        $('#divSignTransaction').hide();
        $('#sendTransaction').hide();
        $('#passwordSendTransaction').val('');
        $('#transferValue').val('');
        $('#trnasferFee').val('');
        $('#transferData').val('');
        $('#senderAddress').empty();
        $('#unlockWallet').show();

        $('#textareaSignedTransaction').val('');
        $('#textareaSendTransactionResult').val('');

        showView("viewSendTransaction");
        $('.nav-item').removeClass('active');
        $(this).parent().addClass("active");
    });

    $('#linkDelete').click(deleteWallet);



    $('#buttonGenerateNewWallet').click(generateNewWallet);
    $('#buttonOpenExistingWallet').click(openWalletFromMnemonic);
    $('#buttonShowMnemonic').click(showMnemonic);
    $('#buttonShowAddresses').click(showAddressesAndBalances);
    $('#buttonUnlockWallet').click(unlockWalletAndDeriveAddresses);
    $('#buttonSignTransaction').click(signTransaction);
    $('#buttonSendSignedTransaction').click(sendSignedTransaction);


    function showView(viewName) {
        // Hide all views and show the selected view only
        $('body > section').hide();
        $('#' + viewName).show();

        if (localStorage.JSON) {
            $('#linkCreateNewWallet').hide();
            $('#linkImportWalletFromMnemonic').hide();

            $('#linkShowMnemonic').show();
            $('#linkShowAddressesAndBalances').show();
            $('#linkSendTransaction').show();
            $('#linkDelete').show();

        } else {
            $('#linkShowMnemonic').hide();
            $('#linkShowAddressesAndBalances').hide();
            $('#linkSendTransaction').hide();
            $('#linkDelete').hide();

            $('#linkCreateNewWallet').show();
            $('#linkImportWalletFromMnemonic').show();
        }
    }


    function showInfo(message) {
        $('#infoBox > span').html(message);
        $('#infoBox').show();
        $('#infoBoxClose').click(function () {
            $('#infoBox').hide();
            $('#infoBox > span').html("");
        })
        $('#infoBox').delay(5000).fadeOut(300);
    }

    function showError(errorMsg) {
        $('#errorBox > span').html(errorMsg);
        $('#errorBox').show();
        $('#errorBoxClose').click(function () {
            $('#errorBox').hide();
            $('#errorBox > span').html("");
        })
        $('#errorBox').delay(5000).fadeOut(300);
    }

    function showLoadingProgress(percent) {
        var  val = percent * 100;
        $("#loadingBox").show();
        $("#loadingBox > .progress-bar").attr({
            'style' : 'width: ' + val.toString() + "%",
            'aria-valuenow' : val
        });
    }

    function hideLoadingBar() {
        $("#loadingBox").hide();
    }

    function showLoggedInButtons() {
        $('#linkCreateNewWallet').hide();
        $('#linkImportWalletFromMnemonic').hide();

        $('#linkShowMnemonic').show();
        $('#linkShowAddressesAndBalances').show();
        $('#linkSendTransaction').show();
        $('#linkDelete').show();
    }

    function encryptAndSaveJSON(wallet, password) {
        return wallet.encrypt(password, showLoadingProgress)
            .then(json => {
                localStorage['JSON'] = json;
                showLoggedInButtons();
            })
            .catch(showError)
            .finally(hideLoadingBar);
    }

    function decryptWallet(json, password) {
        return Wallet.decryptFromJSON(json, password, showLoadingProgress);
    }

    function generateNewWallet() {
        let password = $('#passwordCreateWallet').val();
        let wallet = Wallet.createRandom();

        if(password === '')
            return showError("Invalid password");

        encryptAndSaveJSON(wallet, password)
            .then(() => {
                showInfo("PLEASE SAVE YOUR MNEMONIC: " + wallet.mnemonic);
                $('#textareaCreateWalletResult').val(localStorage.JSON);
                $('#passwordCreateWallet').val("");
            })
    }

    function openWalletFromMnemonic() {
        let mnemonic = $('#textareaOpenWallet').val();
        if(!bip39.validateMnemonic(mnemonic))
            return showError("Invalid mnemonic");

        let password = $('#passwordOpenWallet').val();

        if(password === '')
            return showError("Invalid password");

        let wallet = Wallet.fromMnemonic(mnemonic);

        encryptAndSaveJSON(wallet, password)
        .then(() => {
            $('#passwordOpenWallet').val("");
            $('#textareaOpenWallet').val("");
            showInfo("Wallet successfully loaded");
            $('#textareaOpenWalletResult').val(localStorage.JSON);
        })
    }

    function showMnemonic() {
        let password = $('#passwordShowMnemonic').val();
        let json = localStorage.JSON;

        decryptWallet(json, password)
            .then(wallet => {
                $('#passwordShowMnemonic').val('');
                showInfo("Your mnemonic is : " + wallet.mnemonic);
            })
            .catch(showError)
            .finally(hideLoadingBar);
    }

    function showAddressesAndBalances() {
        let password = $('#passwordShowAddresses').val();
        let nodeURL = $('#nodeURLShowAddresses').val();
        let json = localStorage.JSON;

        decryptWallet(json, password)
            .then(renderAddressesAndBalances)
            .catch(error => {
                $('#divAddressesAndBalances').empty();
                showError(error);
            })
            .finally(hideLoadingBar);

            function renderAddressesAndBalances(wallet) {
                $('#divAddressesAndBalances').empty();
                $('#passwordShowAddresses').val("");
                $('#nodeURLShowAddresses').val("");

                let seed = bip39.mnemonicToSeedSync(wallet.mnemonic);
                let root = hdkey.fromMasterSeed(seed);

                for(var i = 0; i < 5; i++) {
                    let div = $('<div class="row">');
                    let div1 = $('<div class="col col-4">');
                    let div2 = $('<div class=col col-8">')
                    let path = "m/44'/0'/0'/0/" + i;
                    let addrNode = root.derive(path);
                    let w = new Wallet(addrNode._privateKey);

                    w.getBalance(nodeURL, function(response) {
                        if(response.status == 1) {
                            div1.qrcode(wallet.address);
                            div2.append($(`<p>Address: ${w.address}</p>
                                        <p>Safe Balance : ${response.msg.safeBalance/1000000} coins (${response.msg.safeBalance} micro-coins)</p>
                                        <p>Confirmed Balance : ${response.msg.confirmedBalance/1000000} coins (${response.msg.confirmedBalance} micro-coins) </p>
                                        <p>Pending Balance : ${response.msg.pendingBalance/1000000} coins (${response.msg.pendingBalance} micro-coins) </p>`));
                            div.append(div1);
                            div.append(div2);
                            $('#divAddressesAndBalances').append(div);
                        } else {
                            showError("Invalid address!");
                        }
                    });
                }
            }
    }

    function unlockWalletAndDeriveAddresses() {
        let password = $('#passwordSendTransaction').val();
        let json = localStorage.JSON;

        decryptWallet(json, password)
            .then(wallet => {
                showInfo("Wallet successfully unlocked!");
                renderAddresses(wallet);
                $('#divSignTransaction').show();
                $('#unlockWallet').hide();
                $('#passwordSendTransaction').val("");
            })
            .catch(showError)
            .finally(() => {
                $('#passwordSendTransaction').val('');
                hideLoadingBar();
            });

            function renderAddresses(wallet) {
                $('#divAddressesAndBalances').empty();

                let seed = bip39.mnemonicToSeedSync(wallet.mnemonic);
                let root = hdkey.fromMasterSeed(seed);

                for(let i = 0; i < 5; i++) {
                    let path = "m/44'/0'/0'/0/" + i;
                    let addrNode = root.derive(path);
                    let w = new Wallet(addrNode._privateKey);
                    let address = w.address;

                    wallets[address] = w;
                    let option = $(`<option id=${w.address}>`).text(address);
                    $("#senderAddress").append(option);
                }
            }
    }

    function signTransaction() {
        let senderAddress = $('#senderAddress option:selected').attr('id');

        let wallet = wallets[senderAddress];
        if(!wallet)
            return showError("Invalid address!");

        let recipient = $('#recipientAddress').val();
        if(!recipient)
            return showError("Invalid recipient!");

        if(!validateAddress(recipient))
            return showError("Invalid recipient address!");

        let value = $('#transferValue').val();
        if(!value)
            return showError("Invalid transfer value!");

        if(parseInt(value) <= 0)
            return showError("Minimum transfer value is 1 micro-coin!");

        let fee = $("#transferFee").val();
        if(!fee)
            return showError("Invalid transfer free");

        if(parseInt(fee) < 10)
            return showError("Minimum fee is 10 micro-coins!");

        let data = $("#transferData").val();


        if(data && data !="") {
            let transaction = {
                from : wallet.address,
                to: recipient,
                value : parseInt(value),
                fee: parseInt(fee),
                dateCreated : new Date().toISOString(),
                data : data,
                senderPubKey : wallet.publicKey
            }
            let signedTxn = wallet.sign(transaction);
            $('#textareaSignedTransaction').val(signedTxn);
            $("#divSignTransaction").hide();
            $("#sendTransaction").show();
            showInfo("Successfully signed transaction!");
        } else {
            let transaction = {
                from : wallet.address,
                to: recipient,
                value : parseInt(value),
                fee: parseInt(fee),
                dateCreated : new Date().toISOString(),
                senderPubKey : wallet.publicKey
            }
            let signedTxn = wallet.sign(transaction);
            $('#textareaSignedTransaction').val(signedTxn);
            $("#divSignTransaction").hide();
            $("#sendTransaction").show();
            showInfo("Successfully signed transaction!");
        }

        $('#recipientAddress').val("");
        $('#transferValue').val("");
        $("#transferFee").val("");
        $("#transferData").val("");

    }

    function sendSignedTransaction() {
        let signedTransaction = $("#textareaSignedTransaction").val();
        let nodeURL = $("#nodeURLSignedTransaction").val();

        if(!nodeURL)
            return showError("Node URL required!");

        Wallet.send(nodeURL, signedTransaction, function(response) {
            if(response.status === 1) {
                var msg = `Transaction successfully sent! Transaction Hash: ${response.msg.transactionDataHash}`;
                $('#textareaSendTransactionResult').val(msg);
                showInfo(`Transaction successfully sent! Transaction Hash: ${response.msg.transactionDataHash}`);
            } else {
                showError(response.msg.errorMsg);
            }
        });

    }

    function deleteWallet() {
        localStorage.clear();
        showView('viewHome');
    }


    function validateAddress(address) {

		var re = /[0-9A-Fa-f]{6}/g;
		if(!re.test(address) || address.length != 40) {
			return false;
		}

		return true;
	}

});