document.addEventListener("DOMContentLoaded", () => {
  gsap.registerPlugin(ScrollTrigger);

  let isHeroVisible = true;
  let lenis = null;
  // Inicializa Lenis para Smooth Scroll fluido com inércia
  if (typeof Lenis !== "undefined") {
    lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    lenis.on("scroll", ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(500, 33);
  }

  const video = document.querySelector(".hero-video");
  const asciiHero = document.getElementById("ascii-hero");

  if (video && asciiHero) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const asciiRamp = " .:-=+*#%@";
    const rampLength = asciiRamp.length;

    let cols, rows;

    function updateDimensions() {
      // Calcula colunas e linhas levando em consideração a proporção dos caracteres monoespaçados
      const charWidth = 5.5; // Largura média em px
      const charHeight = 7; // Altura de linha em px
      const fontAspect = charWidth / charHeight;
      const screenAspect = window.innerWidth / window.innerHeight;

      cols = Math.ceil(window.innerWidth / charWidth);
      rows = Math.ceil(cols / (screenAspect / fontAspect));
      canvas.width = cols;
      canvas.height = rows;
    }

    updateDimensions();
    window.addEventListener("resize", updateDimensions);

    function renderAsciiHero() {
      if (isHeroVisible && video.readyState >= 2 && !video.paused) {
        ctx.drawImage(video, 0, 0, cols, rows);
        const imageData = ctx.getImageData(0, 0, cols, rows);
        const data = imageData.data;
        let asciiText = "";

        for (let y = 0; y < rows; y++) {
          let line = "";
          for (let x = 0; x < cols; x++) {
            const index = (y * cols + x) * 4;
            const r = data[index];
            const g = data[index + 1];
            const b = data[index + 2];

            const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            const charIndex = Math.floor(brightness * (rampLength - 1));
            line += asciiRamp[charIndex];
          }
          asciiText += line.trimEnd() + "\n";
        }
        asciiHero.textContent = asciiText;
      }
      requestAnimationFrame(renderAsciiHero);
    }

    video.play().catch(() => {});
    renderAsciiHero();
  }

  const asciiHandLeft = document.getElementById("ascii-hand-left");
  const asciiHandRight = document.getElementById("ascii-hand-right");

  function renderImageToAscii(imageSrc, targetElement, targetCols = 95) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageSrc;
    img.onload = () => {
      const fontAspect = 0.58;
      const imgAspect = img.width / img.height;
      const cols = targetCols;
      const rows = Math.round(cols / (imgAspect / fontAspect));

      const canvas = document.createElement("canvas");
      canvas.width = cols;
      canvas.height = rows;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });

      ctx.drawImage(img, 0, 0, cols, rows);
      const imageData = ctx.getImageData(0, 0, cols, rows);
      const data = imageData.data;
      const asciiRamp = " .:-=+*#%@";
      let asciiText = "";

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const index = (y * cols + x) * 4;
          const r = data[index];
          const g = data[index + 1];
          const b = data[index + 2];
          const a = data[index + 3];

          // Preserva a transparência do fundo da imagem
          if (a < 40) {
            asciiText += " ";
          } else {
            const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            const charIndex = Math.floor(brightness * (asciiRamp.length - 1));
            asciiText += asciiRamp[charIndex];
          }
        }
        asciiText += "\n";
      }
      targetElement.textContent = asciiText;
      targetElement.dataset.originalText = asciiText;
    };
  }

  if (asciiHandLeft) {
    renderImageToAscii(
      "src/mãos-sembg-esquerda-gpt.webp",
      asciiHandLeft,
      85,
      60,
    );
  }
  if (asciiHandRight) {
    renderImageToAscii(
      "src/mãos-sembg-direita-gpt.webp",
      asciiHandRight,
      85,
      60,
    );
  }

  // Função de Descriptografia de Texto (Efeito Scramble / Decrypt)
  const cryptoGlyphs =
    "!@#$%^&*()_+-=[]{}|;:,.<>?/0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ.:-=+*#%@";

  function decryptText(element, options = {}) {
    if (!element) return;
    const duration = options.duration || 1.4;
    const delay = options.delay || 0;
    const originalText =
      element.dataset.originalText || element.textContent.trim();
    element.dataset.originalText = originalText;

    const progressObj = { progress: 0 };

    return gsap.to(progressObj, {
      progress: 1,
      duration: duration,
      delay: delay,
      ease: options.ease || "power2.inOut",
      onUpdate: () => {
        const p = progressObj.progress;
        const revealedCount = Math.floor(p * originalText.length);
        let result = "";

        for (let i = 0; i < originalText.length; i++) {
          const char = originalText[i];
          if (char === " " || char === "\n") {
            result += char;
          } else if (i < revealedCount) {
            result += char;
          } else {
            const randomGlyph =
              cryptoGlyphs[Math.floor(Math.random() * cryptoGlyphs.length)];
            result += randomGlyph;
          }
        }
        element.textContent = result;
      },
      onComplete: () => {
        element.textContent = originalText;
        if (options.onComplete) options.onComplete();
      },
    });
  }

  // Função para rodar periodicamente a animação de criptografia/glitch nas mãos ASCII
  function startPeriodicHandGlitch(element, delayMs = 4500) {
    if (!element) return;
    setInterval(() => {
      if (element.dataset.originalText) {
        decryptText(element, { duration: 1.0, ease: "power1.inOut" });
      }
    }, delayMs);
  }

  startPeriodicHandGlitch(asciiHandLeft, 4500);
  setTimeout(() => {
    startPeriodicHandGlitch(asciiHandRight, 4500);
  }, 2250);

  const h2 = document.querySelector(".text-container h2");
  const paragraph = document.querySelector(".text-container p");
  const headerLinks = document.querySelectorAll("header p");

  // Pre-salva o texto original e habilita o hover interativo e clique para navegação no Header
  headerLinks.forEach((link) => {
    link.dataset.originalText = link.textContent.trim();
    link.style.cursor = "pointer";
    link.addEventListener("mouseenter", () => {
      decryptText(link, { duration: 0.8 });
    });

    link.addEventListener("click", () => {
      const targetSelector = link.dataset.target;
      if (!targetSelector) return; // 'Projetos' não possui target ainda

      if (targetSelector === "#inicio" || targetSelector === "top") {
        if (lenis) {
          lenis.scrollTo(0, { duration: 1.4 });
        } else {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      } else {
        const targetElement = document.querySelector(targetSelector);
        if (targetElement) {
          if (lenis) {
            lenis.scrollTo(targetElement, { duration: 1.4, offset: -20 });
          } else {
            targetElement.scrollIntoView({ behavior: "smooth" });
          }
        }
      }
    });
  });

  // Habilita navegação nos links do Footer
  const footerNavLinks = document.querySelectorAll(".footer-col p[data-target]");
  footerNavLinks.forEach((link) => {
    link.addEventListener("click", () => {
      const targetSelector = link.dataset.target;
      if (!targetSelector) return;

      if (targetSelector === "#inicio" || targetSelector === "top") {
        if (lenis) {
          lenis.scrollTo(0, { duration: 1.4 });
        } else {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      } else {
        const targetElement = document.querySelector(targetSelector);
        if (targetElement) {
          if (lenis) {
            lenis.scrollTo(targetElement, { duration: 1.4, offset: -20 });
          } else {
            targetElement.scrollIntoView({ behavior: "smooth" });
          }
        }
      }
    });
  });

  if (h2) {
    h2.dataset.originalText = h2.textContent.trim();
    h2.style.cursor = "pointer";
    h2.addEventListener("mouseenter", () => {
      decryptText(h2, { duration: 1.0 });
    });
  }

  if (paragraph) {
    paragraph.dataset.originalText = paragraph.textContent.trim();
  }

  // Função para rodar a animação de criptografia de entrada do Hero
  function playHeroEntranceDecrypt() {
    headerLinks.forEach((link, idx) => {
      decryptText(link, { duration: 1.2, delay: idx * 0.1 });
    });
    if (h2) decryptText(h2, { duration: 1.4, delay: 0.1 });
    if (paragraph) decryptText(paragraph, { duration: 1.6, delay: 0.25 });
  }

  // Animação do Loader ASCII
  const loaderScreen = document.getElementById("ascii-loader");
  const loaderBar = document.getElementById("loader-bar");
  const loaderPercent = document.getElementById("loader-percent");

  if (loaderScreen && loaderBar && loaderPercent) {
    const totalBlocks = 30;
    const filledChar = "█";
    const emptyChar = "░";
    const progressObj = { value: 0 };

    gsap.to(progressObj, {
      value: 100,
      duration: 1.8,
      ease: "power2.inOut",
      onUpdate: () => {
        const currentVal = Math.floor(progressObj.value);
        const filledLength = Math.round((currentVal / 100) * totalBlocks);
        const emptyLength = totalBlocks - filledLength;

        const barString =
          "[" + filledChar.repeat(filledLength) + emptyChar.repeat(emptyLength) + "]";
        loaderBar.textContent = barString;
        loaderPercent.textContent = currentVal + "%";
      },
      onComplete: () => {
        gsap.to(loaderScreen, {
          opacity: 0,
          duration: 0.5,
          ease: "power2.out",
          onComplete: () => {
            loaderScreen.style.display = "none";
            // Dispara a animação de criptografia de entrada dos textos do Hero AQUI
            playHeroEntranceDecrypt();
          },
        });
      },
    });
  } else {
    playHeroEntranceDecrypt();
  }

  const hero = document.querySelector(".hero");
  const headerElem = document.querySelector("header");

  // Timeline principal do ScrollTrigger
  const tlScroll = gsap.timeline({
    scrollTrigger: {
      trigger: ".hero-section-wrapper",
      start: "top top",
      end: "+=200%",
      scrub: 1,
      pin: true,
      pinSpacing: true,
      anticipatePin: 1,
      fastScrollEnd: true,
      onUpdate: (self) => {
        if (!headerElem) return;
        if (self.progress > 0.25) {
          headerElem.classList.add("header-on-blue");
        } else {
          headerElem.classList.remove("header-on-blue");
        }
      },
    },
  });

  if (headerElem) {
    ScrollTrigger.create({
      trigger: ".section-3",
      start: "top top",
      onEnter: () => {
        isHeroVisible = false; // Descarrega a Hero somente quando a Seção 3 cobre o topo do viewport
        headerElem.classList.add("header-glass");
        headerElem.classList.remove("header-on-blue");
      },
      onEnterBack: () => {
        isHeroVisible = false;
        headerElem.classList.add("header-glass");
        headerElem.classList.remove("header-on-blue");
      },
      onLeave: () => {
        headerElem.classList.add("header-glass");
        headerElem.classList.add("header-on-blue");
      },
      onLeaveBack: () => {
        isHeroVisible = true; // Reativa a Hero no exato momento em que ela volta para a tela
        headerElem.classList.remove("header-glass");
        headerElem.classList.add("header-on-blue");
      },
    });

    ScrollTrigger.create({
      trigger: ".footer-section",
      start: "top 80px",
      onEnter: () => {
        headerElem.classList.add("header-glass");
        headerElem.classList.add("header-on-blue");
      },
      onLeaveBack: () => {
        headerElem.classList.add("header-glass");
        headerElem.classList.remove("header-on-blue");
      },
    });
  }

  // ETAPA 1: Hero encolhe
  tlScroll.to(hero, {
    scale: 0.3,
    duration: 1,
    ease: "power1.inOut",
  });

  // ETAPA 2: Mão Esquerda ASCII (Desce da esquerda acompanhando o scroll)
  if (asciiHandLeft) {
    tlScroll.fromTo(
      asciiHandLeft,
      {
        xPercent: -100,
        yPercent: -60,
        rotation: -30,
      },
      {
        xPercent: -5,
        yPercent: 0,
        rotation: 15,
        duration: 1,
        ease: "power2.out",
      },
      "-=0.8",
    );
  }

  // ETAPA 3: Mão Direita ASCII (Sobe da direita acompanhando o scroll)
  if (asciiHandRight) {
    tlScroll.fromTo(
      asciiHandRight,
      {
        xPercent: 100,
        yPercent: 60,
        rotation: 45,
      },
      {
        xPercent: 5,
        yPercent: 0,
        rotation: 25,
        duration: 1,
        ease: "power2.out",
      },
      "<",
    );
  }

  const loremTopRight = document.querySelector(".lorem-top-right");
  const loremBottomLeft = document.querySelector(".lorem-bottom-left");

  if (loremTopRight) {
    tlScroll.fromTo(
      loremTopRight,
      { opacity: 0, x: 40 },
      { opacity: 1, x: 0, duration: 1, ease: "power2.out" },
      "-=0.8"
    );
  }

  if (loremBottomLeft) {
    tlScroll.fromTo(
      loremBottomLeft,
      { opacity: 0, x: -40 },
      { opacity: 1, x: 0, duration: 1, ease: "power2.out" },
      "<"
    );
  }


  // ETAPA 4: Efeito Parallax APENAS INTERNO das imagens da Seção 3 (sem mover os containers)
  const section3Wrappers = document.querySelectorAll(".section-3 .filtro-azul-wrapper");
  if (section3Wrappers.length > 0) {
    section3Wrappers.forEach((wrapper) => {
      const img = wrapper.querySelector("img");
      if (img) {
        gsap.fromTo(
          img,
          { yPercent: -20, scale: 1.25 },
          {
            yPercent: 20,
            scale: 1.25,
            ease: "none",
            scrollTrigger: {
              trigger: wrapper,
              start: "top bottom",
              end: "bottom top",
              scrub: 1,
            },
          }
        );
      }
    });
  }

  // ETAPA 4.5: Vídeo Anjo Arco com avanço de frames e zoom de 30% a 100% conforme a rolagem
  const videoAnjo = document.querySelector(".video-anjo-arco");
  const sectionAnjo = document.querySelector(".section-3-5");

  if (videoAnjo && sectionAnjo) {
    let scrollCreated = false;

    function setupVideoAnjoScroll() {
      if (scrollCreated) return;
      scrollCreated = true;

      gsap.timeline({
        scrollTrigger: {
          trigger: sectionAnjo,
          start: "top top",
          end: "+=200%",
          scrub: 0.5,
          pin: true,
          pinSpacing: true,
          onUpdate: (self) => {
            if (videoAnjo.duration && !isNaN(videoAnjo.duration)) {
              videoAnjo.currentTime = self.progress * videoAnjo.duration;
            }
          },
        },
      }).fromTo(
        videoAnjo,
        { scale: 0.3, borderRadius: "24px" },
        { scale: 1.0, borderRadius: "0px", ease: "none" }
      );
    }

    if (videoAnjo.readyState >= 1) {
      setupVideoAnjoScroll();
    } else {
      videoAnjo.addEventListener("loadedmetadata", setupVideoAnjoScroll);
      setTimeout(setupVideoAnjoScroll, 500);
    }
  }

  // ETAPA 5: Efeito de Descriptografia no Scroll do Footer (Seção 4)
  const footerDecryptTargets = document.querySelectorAll(".footer-section .decrypt-target");
  if (footerDecryptTargets.length > 0) {
    footerDecryptTargets.forEach((target) => {
      target.dataset.originalText = target.textContent.trim();
      target.addEventListener("mouseenter", () => {
        decryptText(target, { duration: 0.8 });
      });
    });

    ScrollTrigger.create({
      trigger: ".footer-section",
      start: "top 75%",
      once: true,
      onEnter: () => {
        footerDecryptTargets.forEach((target, index) => {
          decryptText(target, { duration: 1.4, delay: index * 0.08 });
        });
      },
    });
  }
});
