function applyParsedPdfValues() {
      const keys = Object.keys(temporarilyParsedLabResults);
      if (keys.length === 0) return;

      if (!state.labValues) {
        state.labValues = { d3: null, b12: null, ferritin: null, mg: null, ca: null, zinc: null, creatinine: null, folate: null, alt: null, hb: null, mcv: null, crp: null };
      }

      keys.forEach(k => {
        const item = temporarilyParsedLabResults[k];
        const inputEl = document.getElementById(item.inputId);
        if (inputEl) inputEl.value = item.value;
        updateVitaLabLiveFeedback(item.inputId, k);
        const numericVal = (item.value === null || item.value === undefined || item.value === "") ? null : parseFloat(item.value);
        state.labValues[k] = (numericVal !== null && !isNaN(numericVal)) ? numericVal : item.value;
        if (!state.labReferences) state.labReferences = {};
        state.labReferences[k] = String(item.reference || "").trim();
        const refInput = document.getElementById(`inputLabRef-${k}`);
        if (refInput) refInput.value = String(item.reference || "").trim();
      });

      closeENabizModal();
      saveCurrentLabRecordWithDate();
    }

    function openOnboardingModal() {
      const modal = document.getElementById("onboardingModal");
      if (modal) { modal.classList.remove("hidden"); modal.style.display = "flex"; }
    }

    function closeOnboardingModal() {
      const modal = document.getElementById("onboardingModal");
      if (modal) { modal.classList.add("hidden"); modal.style.display = "none"; }
    }

    /* ÇAKIŞMA & BİYOYARARLANIM EMNİYET KALKANI */
    function detectSupplementConflicts() {
      const banner = document.getElementById("conflictShieldAlertBanner");
      if (!banner) return;

      if (!state.supplements || state.supplements.length === 0) {
        banner.classList.add("hidden");
        banner.style.display = "none";
        banner.innerHTML = "";
        return;
      }

      const conflicts = [];
      const chronicList = state.user?.chronic || [];
      const hasPPI = chronicList.includes("ppi");
      const hasBloodThinner = chronicList.includes("blood_thinner");

      const timings = ["Sabah", "Öğle", "Akşam"];
      timings.forEach(t => {
        const timeItems = state.supplements.filter(s => (s.timing || "").toLowerCase() === t.toLowerCase());
        const names = timeItems.map(i => ((i.formKey || "") + " " + (i.name || "")).toLowerCase());

        const hasIron = names.some(n => n.includes("demir") || n.includes("iron") || /\bfe\b/.test(n));
        const hasCalcium = names.some(n => n.includes("kalsiyum") || n.includes("calcium"));
        const hasZinc = names.some(n => n.includes("çinko") || n.includes("cinko") || n.includes("zinc") || /\bzn\b/.test(n));

        if (hasIron && hasCalcium) {
          conflicts.push({
            severity: "danger",
            title: `⛔ DMT1 Antagonizması: Demir & Kalsiyum Aynı Zaman Diliminde (${t})`,
            desc: `Demir ve Kalsiyum mineralleri aynı bağırsak taşıyıcı proteinlerini (DMT1) kullandığı için birbirinin emilimini %80'e kadar bloke eder. Demir takviyesini bu öğünden ayırıp en az 3 saat ara ile alınız ve hekiminize danışınız.`
          });
        }

        if (hasIron && hasZinc) {
          conflicts.push({
            severity: "warning",
            title: `⚠️ Metal İyon Rekabeti: Demir & Çinko Birlikte Alımı (${t})`,
            desc: `Yüksek doz demir ve çinko mineralleri aynı öğünde alındığında emilim kompetisyonu yaratır. İki minerali günün farklı saatlerine dağıtmanız ve hekim gözetiminde almanız önerilir.`
          });
        }
      });

      if (hasPPI) {
        state.supplements.forEach(sup => {
          const key = (sup.formKey || "").toLowerCase();
          const form = (sup.selectedForm || "").toLowerCase();
          const name = (sup.name || "").toLowerCase();

          if ((key === "demir" || name.includes("demir")) && (form.includes("tablet") || form.includes("kapsul") || form.includes("kapsül"))) {
            conflicts.push({
              severity: "warning",
              title: `⚠️ PPI & Demir Formu Uyumsuzluğu: (${escapeHtmlText(sup.name)})`,
              desc: `Mide koruyucu (PPI) ilacınız mide asidini (HCl) baskıladığından standart tablet demir emilemez. Çözüm: Hekim onayınızla mide asidine ihtiyaç duymayan "Lipozomal Saşe" formuna geçiş yapınız.`
            });
          }

          if ((key === "b12" || name.includes("b12")) && form.includes("kapsul")) {
            conflicts.push({
              severity: "warning",
              title: `⚠️ PPI & B12 Emilim Kaybı: (${escapeHtmlText(sup.name)})`,
              desc: `Mide koruyucu ilaçlar İntrinsik Faktör salınımını azalttığı için klasik kapsül B12 biyoyararlanımı düşer. Çözüm: Hekiminize danışarak mideyi baypas eden "Dilaltı (Sublingual) Tablet veya Sprey" formunu seçiniz.`
            });
          }
        });
      }

      if (hasBloodThinner) {
        state.supplements.forEach(sup => {
          const key = (sup.formKey || "").toLowerCase();
          const name = (sup.name || "").toLowerCase();

          if ((name.includes("k2") || key.includes("k2")) && !name.includes("k2'siz")) {
            conflicts.push({
              severity: "danger",
              title: `⛔ Kritik Kan Sulandırıcı Kilidi: (${escapeHtmlText(sup.name)})`,
              desc: `Kan sulandırıcı (Coumadin, Aspirin vb.) ilaç kullanırken K2 vitamini tüketimi pıhtılaşma kaskadını doğrudan etkileyebilir. Bu takviyeyi derhal hekiminize bildiriniz ve listenizden çıkarınız!`
            });
          }

          if (key === "omega3" || name.includes("omega") || name.includes("balık yağı")) {
            conflicts.push({
              severity: "warning",
              title: `⚠️ Trombosit & Kanama Süresi Riski: (${escapeHtmlText(sup.name)})`,
              desc: `Kan sulandırıcı ilaçlar ile eşzamanlı yüksek doz Omega-3 alımı kanama eğilimini artırabilir. Günlük dozu hekiminize onaylatmadan kesinlikle artırmayınız.`
            });
          }
        });
      }

      if (conflicts.length > 0) {
        banner.classList.remove("hidden");
        banner.style.display = "block";
        banner.innerHTML = `
          <div class="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-950 via-rose-900 to-navy-950 border-2 border-rose-500 text-white shadow-xl space-y-3 pulse-danger">
            <div class="flex items-center justify-between pb-2 border-b border-rose-700/60">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center font-black text-sm flex-shrink-0 shadow-md">
                  <i class="fa-solid fa-shield-virus"></i>
                </div>
                <div>
                  <h4 class="text-xs sm:text-sm font-black text-white tracking-wide">
                    🛡️ Çakışma & Biyoyararlanım Emniyet Kalkanı Devrede!
                  </h4>
                  <span class="text-[10px] text-rose-300 font-semibold">
                    ${conflicts.length} Adet Kritik Emilim / Zamanlama Çakışması Tespit Edildi
                  </span>
                </div>
              </div>
              <span class="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-rose-500/30 text-rose-200 border border-rose-400/50">
                Hekim Danışmanlığı Şart
              </span>
            </div>

            <div class="space-y-2">
              ${conflicts.map(c => `
                <div class="p-3 rounded-xl ${c.severity === 'danger' ? 'bg-rose-900/60 border border-rose-400/80 text-rose-100' : 'bg-amber-900/40 border border-amber-400/70 text-amber-100'} text-xs">
                  <strong class="font-bold block text-xs ${c.severity === 'danger' ? 'text-rose-200' : 'text-amber-200'}">
                    ${escapeHtmlText(c.title)}
                  </strong>
                  <p class="text-[11px] leading-relaxed mt-0.5 opacity-95">
                    ${escapeHtmlText(c.desc)}
                  </p>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      } else {
        banner.classList.add("hidden");
        banner.style.display = "none";
        banner.innerHTML = "";
      }
    }

    /* BOYLAMSAL BİYOLOJİK YANIT SÜRESİ KONTROLÜ */
    