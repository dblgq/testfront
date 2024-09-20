// Элементы на странице
const connectButton = document.getElementById("connect-wallet");
const payButton = document.getElementById("pay-with-wallet");
const walletInfo = document.getElementById("wallet-info");
const publicKeyDisplay = document.getElementById("public-key");

let publicKey = null;

// Функция для определения мобильного устройства
function isMobile() {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

// Функция для подключения к Phantom Wallet
connectButton.addEventListener("click", async () => {
  if (isMobile()) {
    // Мобильный deeplink для Phantom Wallet
    const redirectUri = encodeURIComponent(
      "https://dblgq.github.io/testfront/"
    ); // Ваш redirect URI
    const cluster = "mainnet-beta"; // Опционально: mainnet-beta, testnet или devnet
    const deeplink = `https://phantom.app/ul/v1/connect?redirect_link=${redirectUri}&cluster=${cluster}`;

    console.log("Redirecting to Phantom via deeplink:", deeplink);
    window.location.href = deeplink; // Перенаправление на deeplink Phantom Wallet
  } else {
    // Десктопная версия
    if (window.solana && window.solana.isPhantom) {
      try {
        // Подключение к Phantom Wallet
        const response = await window.solana.connect();
        publicKey = response.publicKey.toString();
        console.log("Connected with public key:", publicKey);

        // Отображение информации о кошельке
        walletInfo.style.display = "block";
        publicKeyDisplay.textContent = publicKey;

        // Сохранение публичного ключа в localStorage
        localStorage.setItem("publicKey", publicKey);
      } catch (err) {
        console.error("User rejected the connection request:", err);
      }
    } else {
      // Если Phantom не установлен, перенаправляем на страницу скачивания
      window.location.href = "https://phantom.app/download";
    }
  }
});

// Обработка возвращения на сайт после подключения через Phantom Wallet
window.addEventListener("load", () => {
  const params = new URLSearchParams(window.location.search);
  const pubKey = params.get("public_key"); // Получаем публичный ключ из URL

  if (pubKey) {
    console.log("Public key received:", pubKey);
    publicKey = pubKey;
    walletInfo.style.display = "block";
    publicKeyDisplay.textContent = publicKey;

    // Сохранение публичного ключа для последующего использования
    localStorage.setItem("publicKey", publicKey);
  } else {
    console.log("No public key found in URL.");

    // Проверяем, есть ли сохраненный публичный ключ в localStorage
    const savedPublicKey = localStorage.getItem("publicKey");
    if (savedPublicKey) {
      publicKey = savedPublicKey;
      walletInfo.style.display = "block";
      publicKeyDisplay.textContent = publicKey;
      console.log("Loaded public key from localStorage:", savedPublicKey);
    }
  }
});

// Пример обработки платежа
payButton.addEventListener("click", async () => {
  if (!publicKey) {
    alert("Please connect your Phantom Wallet first!");
    return;
  }

  try {
    const recipientPublicKey = "EnterRecipientPublicKeyHere"; // Укажите публичный ключ получателя
    const transaction = new solanaWeb3.Transaction().add(
      solanaWeb3.SystemProgram.transfer({
        fromPubkey: new solanaWeb3.PublicKey(publicKey),
        toPubkey: new solanaWeb3.PublicKey(recipientPublicKey),
        lamports: 1000000, // Пример: 0.001 SOL
      })
    );

    // Подпись и отправка транзакции
    const { signature } = await window.solana.signAndSendTransaction(
      transaction
    );
    console.log("Transaction signature:", signature);

    // Отправка запроса на backend для подтверждения (если нужно)
    await fetch("/confirm-transaction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transactionSignature: signature }),
    });

    alert("Payment successful!");
  } catch (err) {
    console.error("Error processing payment:", err);
  }
});
