document.addEventListener("DOMContentLoaded", () => {
  const contentBlocks = document.querySelectorAll(".post-content");

  contentBlocks.forEach((block) => {
    // Evitamos afectar los bloques ya procesados (como las imágenes)
    block.querySelectorAll("*:not(code):not(pre)").forEach((el) => {
      // Trabajamos solo con nodos de texto para evitar reventar el DOM
      el.childNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const replaced = node.textContent.replace(/(?<!\!)\[\[([^\|\]]+)(?:\|([^\]]+))?\]\]/g, (match, file, label) => {
            const href = `/cuaderno-red-team/apuntes/${file.trim()}`;
            const text = (label || file).trim();
            return `<a href="${href}">${text}</a>`;
          });

          if (replaced !== node.textContent) {
            const temp = document.createElement("span");
            temp.innerHTML = replaced;
            el.replaceChild(temp, node);
          }
        }
      });
    });
  });
});
