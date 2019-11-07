$(document).ready(function () {
    const derivationPath = "m/44'/60'/0'/0/";

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
        // let password = $('#passwordShowAddresses').val();
        // let json = localStorage.JSON;

        // decryptWallet(json, password)
        //     .then(renderAddressesAndBalances)
        //     .catch(error => {
        //         $('#divAddressesAndBalances').empty();
        //         showError(error);
        //     })
        //     .finally(hideLoadingBar);

        //     function renderAddressesAndBalances(wallet) {
        //         $('#divAddressesAndBalances').empty();
    
        //         let masterNode = ethers.HDNode.fromMnemonic(wallet.mnemonic);
    
        //         for(let i = 0; i < 5; i++) {
        //             let div = $('<div id="qrcode">');
        //             let wallet = new ethers.Wallet(masterNode.derivePath(derivationPath + i).privateKey, provider);
    
        //             wallet.getBalance()
        //                 .then(balance => {
        //                     div.qrcode(wallet.address);
        //                     div.append($(`<p>${wallet.address} : ${ethers.utils.formatEther(balance)} ETH </p>`));
        //                     $('#divAddressesAndBalances').append(div);
        //                 })
        //                 .catch(showError);
        //         }
        //     }
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