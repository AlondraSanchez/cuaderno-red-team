document.addEventListener("DOMContentLoaded", () => {
  const paragraphs = document.querySelectorAll(".post-content p");

  paragraphs.forEach((p) => {
    const match = p.textContent.trim().match(/^!\[\[([\w\s\-.]+\.png)\]\]$/i);
    if (match) {
      const filename = match[1];
      const altText = filename.replace(/_/g, " ").replace(/\.[^/.]+$/, "");

      const wrapper = document.createElement("p");
      wrapper.setAttribute("align", "center");

      const img = document.createElement("img");
      img.src = '/cuaderno-red-team/assets/images/' + filename;
      img.alt = altText;
      img.width = 600;

      wrapper.appendChild(img);
      p.replaceWith(wrapper);
    }
  });
});
