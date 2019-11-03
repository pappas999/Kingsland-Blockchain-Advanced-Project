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

    $('#linkDelete').click(deleteWallet);


    $('#buttonGenerateNewWallet').click(generateNewWallet);

    function showView(viewName) {
        // Hide all views and show the selected view only
        $('body > section').hide();
        $('#' + viewName).show();

        if (localStorage.JSON) {
            $('#linkCreateNewWallet').hide();
            $('#linkOpenExistingWallet').hide();

            $('#linkShowAddressesAndBalances').show();
            $('#linkDelete').show();

        } else {
            $('#linkShowAddressesAndBalances').hide();
            $('#linkDelete').hide();

            $('#linkCreateNewWallet').show();
            $('#linkOpenExistingWallet').show();
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
        $('#errorBox > span').html(message);
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
        $('#linkOpenExistingWallet').hide();


        $('#linkShowAddressesAndBalances').show();
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

    function generateNewWallet() {
        let password = $('#passwordCreateWallet').val();
        let wallet = Wallet.createRandom()

        encryptAndSaveJSON(wallet, password)
            .then(() => {
                showInfo("PLEASE SAVE YOUR MNEMONIC: " + wallet.mnemonic);
                $('#textareaCreateWalletResult').val(localStorage.JSON);
                $('#passwordCreateWallet').val("");
            })
    }

    function deleteWallet() {
        localStorage.clear();
        showView('viewHome');
    }

});