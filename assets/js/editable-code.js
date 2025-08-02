document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("pre > code").forEach((originalCode) => {
    const language = originalCode.className.replace("language-", "") || "bash";
    const codeText = originalCode.textContent;

    // 🧱 Estructura HTML
    const wrapper = document.createElement("div");
    wrapper.className = "editable-code-wrapper";

    const header = document.createElement("div");
    header.className = "editable-code-header";

    const langLabel = document.createElement("span");
    langLabel.className = "editable-code-lang";
    langLabel.textContent = language;

    const copyButton = document.createElement("button");
    copyButton.className = "editable-copy-btn";
    copyButton.innerText = "📋 Copiar";

    // Botón de copiado
    copyButton.addEventListener("click", () => {
      const textarea = wrapper.querySelector("textarea");
      const pre = wrapper.querySelector("pre code");
      const contentToCopy = textarea && textarea.style.display !== "none" ? textarea.value : pre.textContent;

      navigator.clipboard.writeText(contentToCopy);
      copyButton.innerText = "✅ Copiado";
      setTimeout(() => (copyButton.innerText = "📋 Copiar"), 2000);
    });

    // Bloque de código resaltado con Prism
    const highlightedCode = Prism.highlight(codeText, Prism.languages[language] || Prism.languages.markup, language);
    const code = document.createElement("code");
    code.className = `language-${language}`;
    code.innerHTML = highlightedCode;

    const pre = document.createElement("pre");
    pre.appendChild(code);

    // Al hacer click en el bloque, cambiar a textarea
    pre.addEventListener("click", () => switchToEditable(wrapper, textarea, language));

    // Textarea editable
    const textarea = document.createElement("textarea");
    textarea.className = "editable-code-text";
    textarea.value = codeText.trim();
    textarea.style.display = "none";
    textarea.setAttribute("autocomplete", "off");
    textarea.setAttribute("autocorrect", "off");
    textarea.setAttribute("autocapitalize", "off");
    textarea.setAttribute("spellcheck", "false");


    // Cuando se hace click fuera del textarea
    textarea.addEventListener("focusout", () => switchToHighlighted(wrapper, textarea, language));

    // 🏗️ Montar todo
    header.appendChild(langLabel);
    header.appendChild(copyButton);
    wrapper.appendChild(header);
    wrapper.appendChild(pre);
    wrapper.appendChild(textarea);

    // Reemplazar el <pre><code> por nuestro wrapper completo
    originalCode.parentElement.replaceWith(wrapper);
  });

  function switchToEditable(wrapper, textarea, language) {
    const pre = wrapper.querySelector("pre");

    pre.classList.add("fade-out");
    setTimeout(() => {
      pre.style.display = "none";
      pre.classList.remove("fade-out");

      textarea.style.display = "block";
      textarea.classList.add("fade-in");
      textarea.focus();
      setTimeout(() => textarea.classList.remove("fade-in"), 300);
    }, 30);
  }

  function switchToHighlighted(wrapper, textarea, language) {
    const pre = wrapper.querySelector("pre");
    const code = pre.querySelector("code");

    const updatedText = textarea.value;
    const highlighted = Prism.highlight(updatedText, Prism.languages[language] || Prism.languages.markup, language);
    code.innerHTML = highlighted;

    textarea.classList.add("fade-out");
    setTimeout(() => {
      textarea.style.display = "none";
      textarea.classList.remove("fade-out");

      pre.style.display = "block";
      pre.classList.add("fade-in");
      setTimeout(() => pre.classList.remove("fade-in"), 300);
    }, 30);
  }
});
