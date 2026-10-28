window.addEventListener("DOMContentLoaded", () => {
      const splash = document.getElementById("vitaSplash");
      try { if (window.VitaAIChat) VitaAIChat.initializeConsent(); } catch (consentStartupError) { console.warn("Gemini onay arayüzü başlatılamadı:", consentStartupError); }
      const showRequiredLogin = () => {
        try {
          if (activeUserId && state.user) {
            closeAuthModal();
            return;
          }
          purgeLegacyDemoAccounts();
          const users = getUsersDb();
          openAuthModal();
          switchAuthMode(users.length === 0 ? "register" : "login");
        } catch (authError) {
          console.error("VitaTakip giriş ekranı açılamadı:", authError);
          const modal = document.getElementById("authModal");
          if (modal) { modal.classList.remove("hidden"); modal.style.display = "flex"; }
        }
      };

      // Zamanlayıcıyı başlangıç işlemlerinden önce kur: başlangıçta başka bir hata olsa da splash kaybolur.
      if (splash) {
        window.setTimeout(() => {
          splash.classList.add("splash-leaving");
          window.setTimeout(() => {
            if (splash.isConnected) splash.remove();
            showRequiredLogin();
          }, 500);
        }, 1500);
      } else {
        window.setTimeout(showRequiredLogin, 0);
      }

      try {
        switchAuthMode("login");
        installVitaUsabilityEnhancements();
        installVitaLabLiveFeedback();
      } catch (uxStartupError) {
        console.warn("Bazı arayüz iyileştirmeleri başlatılamadı:", uxStartupError);
      }

      try {
        updateApiKeyUI();
        updateNotificationToggleUI();
        applyCompactMode();
        startNotificationScheduler();
        safeLocalStorageRemoveItem("vitatakip_active_session_id");
        const savedSessionId = safeSessionStorageGetItem("vitatakip_active_session_id");
        const savedUsers = getUsersDb();
        if (savedSessionId && savedUsers.some(user => user.id === savedSessionId)) {
          activeUserId = savedSessionId;
          loadUserSessionData(savedSessionId);
          renderAllAppViews();
          closeAuthModal();
        } else {
          safeLocalStorageRemoveItem("vitatakip_active_session_id");
          safeSessionStorageRemoveItem("vitatakip_active_session_id");
          activeUserId = null;
          if (window.TTSVoice) TTSVoice.stop();
          resetApplicationDOMAndState();
        }
      } catch (startupError) {
        console.error("VitaTakip başlangıç hazırlığında hata:", startupError);
        safeLocalStorageRemoveItem("vitatakip_active_session_id");
        safeSessionStorageRemoveItem("vitatakip_active_session_id");
        activeUserId = null;
        resetApplicationDOMAndState();
      }
    });
  