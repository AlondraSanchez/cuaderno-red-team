document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("pre > code").forEach((codeBlock) => {
    const language = codeBlock.className.replace("language-", "") || "Bash";
    const codeText = codeBlock.textContent;

    // Crea elementos
    const wrapper = document.createElement("div");
    wrapper.className = "editable-code-wrapper";

    const header = document.createElement("div");
    header.className = "editable-code-header";

    const langLabel = document.createElement("span");
    langLabel.className = "editable-code-lang";
    langLabel.textContent = language;

    const button = document.createElement("button");
    button.className = "editable-copy-btn";
    button.innerText = "📋 Copiar";

    const textarea = document.createElement("textarea");
    textarea.className = "editable-code-text";
    textarea.value = codeText;

    // Reemplaza el bloque original
    const pre = codeBlock.parentNode;
    pre.replaceWith(wrapper);

    // Construye estructura
    header.appendChild(langLabel);
    header.appendChild(button);
    wrapper.appendChild(header);
    wrapper.appendChild(textarea);

    // Lógica de copiar
    button.addEventListener("click", () => {
      textarea.select();
      document.execCommand("copy");
      button.innerText = "✅ Copiado";
      setTimeout(() => (button.innerText = "📋 Copiar"), 2000);
    });
  });
});
