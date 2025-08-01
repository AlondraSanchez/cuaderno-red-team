document.addEventListener("DOMContentLoaded", () => {
  const content = document.querySelector(".post-content");
  const toc = document.querySelector("#toc-scrollspy");
  if (!content || !toc) return;

  const headings = content.querySelectorAll("h1, h2, h3");
  const tocList = document.createElement("ul");
  let activeId = null;

  // 1. Crear índice
  headings.forEach((heading) => {
    if (!heading.id) {
      heading.id = heading.textContent.toLowerCase().replace(/\s+/g, "-");
    }

    const li = document.createElement("li");
    li.classList.add("toc-item", heading.tagName.toLowerCase());

    const a = document.createElement("a");
    a.href = `#${heading.id}`;
    a.textContent = heading.textContent;
    a.classList.add("toc-link");

    li.appendChild(a);
    tocList.appendChild(li);
  });

  toc.appendChild(tocList);

  // 2. Scrollspy persistente
  const observer = new IntersectionObserver(
    (entries) => {
      let bestEntry = null;
      entries.forEach((entry) => {
        if (
          entry.isIntersecting &&
          (!bestEntry || entry.boundingClientRect.top < bestEntry.boundingClientRect.top)
        ) {
          bestEntry = entry;
        }
      });

      if (bestEntry) {
        const id = bestEntry.target.id;
        if (activeId !== id) {
          activeId = id;
          toc.querySelectorAll(".toc-link").forEach((el) => el.classList.remove("active"));
          const activeLink = toc.querySelector(`a[href="#${id}"]`);
          if (activeLink) activeLink.classList.add("active");
        }
      }
    },
    {
      rootMargin: "-40% 0px -50% 0px",
      threshold: [0, 0.1, 0.25, 0.5, 0.75],
    }
  );

  headings.forEach((heading) => observer.observe(heading));

  // 3. Al cargar, marcar el primero como activo
  const firstId = headings[0]?.id;
  if (firstId) {
    const firstLink = toc.querySelector(`a[href="#${firstId}"]`);
    if (firstLink) firstLink.classList.add("active");
  }

  // 4. Al hacer clic en el TOC, marcar activo manualmente
  toc.addEventListener("click", (e) => {
    if (e.target.tagName.toLowerCase() === "a") {
      const all = toc.querySelectorAll(".toc-link");
      all.forEach((link) => link.classList.remove("active"));
      e.target.classList.add("active");
      activeId = e.target.getAttribute("href").substring(1);
    }
  });
});
