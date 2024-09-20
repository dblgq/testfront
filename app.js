// Подключение к Phantom Wallet
const connectButton = document.getElementById("connect-wallet");
const payButton = document.getElementById("pay-with-wallet");
const walletInfo = document.getElementById("wallet-info");
const publicKeyDisplay = document.getElementById("public-key");

let publicKey = null;

// Функция для определения мобильного устройства
function isMobile() {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

connectButton.addEventListener("click", async () => {
  if (isMobile()) {
    // Мобильный deeplink для Phantom Wallet
    const appName = "telegram-mini-app"; // Замените на название вашего приложения
    const redirectUri = encodeURIComponent("https://your-app.com/"); // Замените на ваш redirect URI
    const deeplink = `https://phantom.app/ul/v1?app=${appName}&redirect_uri=${redirectUri}`;
    window.location.href = deeplink;
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

// Обработка авторизации через redirect_uri на мобильных устройствах
window.addEventListener("load", () => {
  const params = new URLSearchParams(window.location.search);
  const pubKey = params.get("public_key");
  if (pubKey) {
    publicKey = pubKey;
    walletInfo.style.display = "block";
    publicKeyDisplay.textContent = publicKey;

    // Сохранение публичного ключа в localStorage
    localStorage.setItem("publicKey", publicKey);
  } else {
    // Проверка, есть ли сохраненный публичный ключ
    const savedPublicKey = localStorage.getItem("publicKey");
    if (savedPublicKey) {
      publicKey = savedPublicKey;
      walletInfo.style.display = "block";
      publicKeyDisplay.textContent = publicKey;
    }
  }
});

payButton.addEventListener("click", async () => {
  if (!publicKey) {
    alert("Please connect your Phantom Wallet first!");
    return;
  }

  // Пример платежа
  try {
    const recipientPublicKey = "EnterRecipientPublicKeyHere"; // Замените на публичный ключ получателя
    const transaction = new solanaWeb3.Transaction().add(
      solanaWeb3.SystemProgram.transfer({
        fromPubkey: new solanaWeb3.PublicKey(publicKey),
        toPubkey: new solanaWeb3.PublicKey(recipientPublicKey),
        lamports: 1000000, // Пример: 0.001 SOL
      })
    );

    if (isMobile()) {
      // Для мобильных устройств можно использовать deeplink для отправки транзакции
      // Здесь упрощенный пример
      const signedTransaction = await window.solana.signTransaction(
        transaction
      );
      const signature = await window.solana.sendTransaction(
        signedTransaction,
        solanaWeb3.clusterApiUrl("mainnet-beta")
      );

      // Отправка запроса на backend для подтверждения
      await fetch("/confirm-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionSignature: signature }),
      });

      alert("Payment successful!");
    } else {
      // Подпись и отправка транзакции на десктопе
      const { signature } = await window.solana.signAndSendTransaction(
        transaction
      );
      console.log("Transaction signature:", signature);

      // Отправка запроса на backend для подтверждения
      await fetch("/confirm-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionSignature: signature }),
      });

      alert("Payment successful!");
    }
  } catch (err) {
    console.error("Error processing payment:", err);
  }
});
