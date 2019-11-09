$(document).ready(function () {

    let wallets = {};

    $("#infoBox").hide();
    $("#errorBox").hide();
    hideLoadingBar();

    showView("viewHome");

    $('#linkHome').click(function () {
        showView("viewHome");
    });

    $('#linkCreateNewWallet').click(function () {
        $('#passwordCreateWallet').val('');
        $('#textareaCreateWalletResult').val('');
        showView("viewCreateNewWallet");
    });

    $('#linkImportWalletFromMnemonic').click(function () {
        $('#textareaOpenWallet').val('');
        $('#passwordOpenWallet').val('');
        $('#textareaOpenWalletResult').val('');
        showView("viewOpenWalletFromMnemonic");
    });

    $('#linkShowMnemonic').click(function () {
        $('#passwordShowMnemonic').val('');
        showView("viewShowMnemonic");
    });

    $('#linkShowAddressesAndBalances').click(function () {
        $('#passwordShowAddresses').val('');
        $('#divAddressesAndBalances').empty();
        showView("viewShowAddressesAndBalances");
    });

    $('#linkSendTransaction').click(function () {
        $('#divSignAndSendTransaction').hide();

        $('#passwordSendTransaction').val('');
        $('#transferValue').val('');
        $('#senderAddress').empty();

        $('#textareaSignedTransaction').val('');
        $('#textareaSendTransactionResult').val('');

        showView("viewSendTransaction");
    });

    $('#linkDelete').click(deleteWallet);



    $('#buttonGenerateNewWallet').click(generateNewWallet);
    $('#buttonOpenExistingWallet').click(openWalletFromMnemonic);
    $('#buttonShowMnemonic').click(showMnemonic);
    $('#buttonShowAddresses').click(showAddressesAndBalances);


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
    }

    function showError(errorMsg) {
        $('#errorBox > span').html(errorMsg);
        $('#errorBox').show();
        $('#errorBoxClose').click(function () {
            $('#errorBox').hide();
            $('#errorBox > span').html("");
        })
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
        let wallet = Wallet.createRandom(password);

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

        let wallet = Wallet.fromMnemonic(mnemonic, password);

        encryptAndSaveJSON(wallet, password)
        .then(() => {
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

                let seed = bip39.mnemonicToSeedSync(wallet.mnemonic, password);
                let root = hdkey.fromMasterSeed(seed);
    
                for(var i = 0; i < 5; i++) {
                    let div = $('<div class="row">');
                    let div1 = $('<div class="col col-4">');
                    let div2 = $('<div class=col col-8">')
                    let path = "m/44'/0'/0'/0/" + i;
                    let addrNode = root.derive(path);
                    let w = new Wallet(addrNode._privateKey);
    
                    w.getBalance(nodeURL, function(balance) {
                        div1.qrcode(wallet.address);
                        div2.append($(`<p>Address: ${w.address}</p>
                                       <p>Safe Balance : ${balance.safeBalance}</p>
                                       <p>Confirmed Balance : ${balance.confirmedBalance}</p>
                                       <p>Peinding Balance : ${balance.pendingBalance}</p>`));
                        div.append(div1);
                        div.append(div2);
                        $('#divAddressesAndBalances').append(div);
                    });
                }
            }
    }

    function unlockWalletAndDeriveAddresses() {

    }

    function signTransaction() {

    }

    function sendSignedTransaction() {

    }

    function deleteWallet() {
        localStorage.clear();
        showView('viewHome');
    }

});