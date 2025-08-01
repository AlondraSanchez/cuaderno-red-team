document.addEventListener("DOMContentLoaded", () => {
  const emojis = {
    info: "ℹ️",
    warning: "⚠️",
    danger: "🔥",
    tip: "💡",
    note: "📝",
    abstract: "📘",
    bug: "🐞",
    question: "❓"
  };

  const blockquotes = document.querySelectorAll(".post-content blockquote");

  blockquotes.forEach((bq) => {
    const paragraphs = bq.querySelectorAll("p");
    if (paragraphs.length === 0) return;

    const firstParagraph = paragraphs[0];
    const firstText = firstParagraph.textContent.replace(/\n/g, ' ').trim();

    const regex = /^\s*\[!(info|warning|tip|note|danger|abstract|bug|question)\]\s*(.*)$/i;
    const match = firstText.match(regex);
    if (!match) return;

    const type = match[1].toLowerCase();
    const rawTitle = match[2] || type.charAt(0).toUpperCase() + type.slice(1);
    const splitTitle = rawTitle.split(":");
    const titleText = splitTitle[0].trim();
    const emoji = emojis[type] || "";

    // Estructura HTML
    const container = document.createElement("div");
    container.classList.add("admonition", `admonition-${type}`);

    const titleDiv = document.createElement("div");
    titleDiv.classList.add("admonition-title");
    titleDiv.textContent = `${emoji} ${titleText}`;

    const contentDiv = document.createElement("div");
    contentDiv.classList.add("admonition-content");

    // Cuerpo
    const rawHTML = firstParagraph.innerHTML.trim();
    const firstColon = rawHTML.indexOf(":");
    const cleanedHTML = firstColon !== -1 ? rawHTML.slice(firstColon + 1).trim() : rawHTML;

if (cleanedHTML) {
  const p = document.createElement("p");
  p.innerHTML = cleanedHTML.replace(/\n/g, "<br>");
  contentDiv.appendChild(p);
}


    paragraphs.forEach((p, i) => {
      if (i === 0) return;
      contentDiv.appendChild(p);
    });

    container.appendChild(titleDiv);
    container.appendChild(contentDiv);
    bq.replaceWith(container);
  });
});
