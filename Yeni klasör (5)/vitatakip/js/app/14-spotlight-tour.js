const VITA_SPOTLIGHT_STEPS = [
      { view: "view-home", selector: "#headerProfileButton", title: "1. Profilinizi oluşturun", description: "Boy, kilo, yaş, biyolojik cinsiyet ve düzenli kullandığınız ilaçları profilinize girin. Bu bilgiler özet ve güvenlik kontrollerini destekler." },
      { view: "view-labs", selector: "#guideLabsTarget", title: "2. Tahlillerim", description: "e-Nabız PDF'inizi yükleyin veya kan değerlerinizi tarihli kaydedin. PDF'den okunan referans aralıklarını önizlemede kontrol edebilirsiniz." },
      { view: "view-neyim", selector: "#guideNeyimTarget", title: "3. NeyimVar?", description: "Belirtilerinizi gündelik dildeki beş anamnez kategorisinden seçin. Sonuçlar ön bilgilendirme ve hekim görüşmesine hazırlık içindir; tanı değildir." },
      { view: "view-home", selector: "#guideDailyProtocolTarget", title: "4. Günlük protokol ve takvim", description: "Kayıtlı takviyelerinizi sabah, öğle ve gece gruplarında takip edin. Toplu işaretleme yalnızca takip kaydını günceller; tedaviyi değiştirmez." },
      { view: "view-report", selector: "#btnPrintFridgeReport", title: "5. Hekim raporu ve buzdolabı çizelgesi", description: "Hekim konsültasyon raporunu veya evde kullanıma uygun A4 çizelgesini yazdırabilirsiniz. Çıktılar hekim onayının yerine geçmez." }
    ];
    let vitaSpotlightStepIndex = 0;
    let vitaSpotlightResizeHandler = null;

    function startVitaSpotlightTour(manual = true) {
      if (!activeUserId) { showToast("Önce giriş yapın", "Kullanım turunu başlatmak için önce hesabınıza giriş yapın.", "warning"); return; }
      if (window.SoundEffects) SoundEffects.playClick();
      vitaSpotlightStepIndex = 0;
      const layer = document.getElementById("vitaSpotlightLayer");
      if (!layer) { showToast("Rehber açılamadı", "Tur öğesi bulunamadı. Sayfayı yenileyip tekrar deneyin.", "error"); return; }
      closeOnboardingModal();
      layer.classList.remove("hidden");
      if (vitaSpotlightResizeHandler) window.removeEventListener("resize", vitaSpotlightResizeHandler);
      vitaSpotlightResizeHandler = () => positionVitaSpotlightTarget();
      window.addEventListener("resize", vitaSpotlightResizeHandler, { passive: true });
      showVitaSpotlightStep(0);
    }

    function showVitaSpotlightStep(index) {
      const step = VITA_SPOTLIGHT_STEPS[index];
      if (!step) return finishVitaSpotlightTour(true);
      vitaSpotlightStepIndex = index;
      if (state.activeTab !== step.view) navigateToView(step.view);
      const titleEl = document.getElementById("vitaTourTitle");
      const descEl = document.getElementById("vitaTourDescription");
      const count = document.getElementById("vitaTourCount");
      const previous = document.getElementById("vitaTourPrevious");
      const next = document.getElementById("vitaTourNext");
      if (count) count.textContent = `${index + 1} / ${VITA_SPOTLIGHT_STEPS.length}`;
      if (titleEl) titleEl.textContent = step.title;
      if (descEl) descEl.textContent = step.description;
      if (previous) previous.disabled = index === 0;
      if (next) next.innerHTML = index === VITA_SPOTLIGHT_STEPS.length - 1 ? 'Turu Bitir <i class="fa-solid fa-check ml-1"></i>' : 'İleri <i class="fa-solid fa-arrow-right ml-1"></i>';
      const target = document.querySelector(step.selector);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      window.setTimeout(positionVitaSpotlightTarget, 260);
    }

    function positionVitaSpotlightTarget() {
      const step = VITA_SPOTLIGHT_STEPS[vitaSpotlightStepIndex];
      const hole = document.getElementById("vitaSpotlightHole");
      const tooltip = document.getElementById("vitaTourTooltip");
      if (!hole || !tooltip || !step) return;
      const target = document.querySelector(step.selector);
      if (!target) {
        hole.style.display = "none";
        tooltip.style.left = "14px";
        tooltip.style.top = `${Math.max(14, window.innerHeight / 2 - 90)}px`;
        return;
      }
      hole.style.display = "block";
      const rect = target.getBoundingClientRect();
      const pad = 6;
      const left = Math.max(6, rect.left - pad);
      const top = Math.max(6, rect.top - pad);
      const width = Math.min(window.innerWidth - left - 6, Math.max(40, rect.width + pad * 2));
      const height = Math.min(window.innerHeight - top - 6, Math.max(36, rect.height + pad * 2));
      hole.style.left = `${left}px`; hole.style.top = `${top}px`; hole.style.width = `${width}px`; hole.style.height = `${height}px`;
      const tooltipWidth = Math.min(390, window.innerWidth - 28);
      const tooltipHeight = tooltip.offsetHeight || 190;
      let tipTop = rect.bottom + 18;
      if (tipTop + tooltipHeight > window.innerHeight - 12) tipTop = rect.top - tooltipHeight - 18;
      tipTop = Math.max(10, Math.min(window.innerHeight - tooltipHeight - 10, tipTop));
      let tipLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
      tipLeft = Math.max(14, Math.min(window.innerWidth - tooltipWidth - 14, tipLeft));
      tooltip.style.left = `${tipLeft}px`; tooltip.style.top = `${tipTop}px`;
    }

    function moveVitaSpotlightTour(delta) {
      if (window.SoundEffects) SoundEffects.playClick();
      const next = vitaSpotlightStepIndex + delta;
      if (next < 0) return;
      if (next >= VITA_SPOTLIGHT_STEPS.length) return finishVitaSpotlightTour(true);
      showVitaSpotlightStep(next);
    }

    function finishVitaSpotlightTour(markSeen = true) {
      const layer = document.getElementById("vitaSpotlightLayer");
      if (layer) layer.classList.add("hidden");
      if (vitaSpotlightResizeHandler) window.removeEventListener("resize", vitaSpotlightResizeHandler);
      vitaSpotlightResizeHandler = null;
      if (markSeen && activeUserId) safeLocalStorageSetItem(`vitatakip_spotlight_seen_${activeUserId}`, "true");
      if (markSeen) showToast("Rehber tamamlandı", "VitaTakip'in temel modüllerini artık menüden açabilirsiniz.", "success");
    }

    function startVitaSpotlightIfFirstVisit() {
      if (!activeUserId || safeLocalStorageGetItem(`vitatakip_spotlight_seen_${activeUserId}`) === "true") return;
      window.setTimeout(() => {
        if (activeUserId && document.getElementById("profileModal")?.classList.contains("hidden")) startVitaSpotlightTour(false);
      }, 500);
    }

    /* A4 BUZDOLABI ÇİZELGESİ */
    