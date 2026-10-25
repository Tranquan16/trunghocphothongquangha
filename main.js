const newsList = document.querySelector("#news-list");
const newsStatus = document.querySelector("#news-status");
const newsDialog = document.querySelector("#news-dialog");
const dialogTitle = document.querySelector("#news-dialog-title");
const dialogDate = document.querySelector("#news-dialog-date");
const dialogContent = document.querySelector("#news-dialog-content");

function addTextElement(parent, tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) {
        element.className = className;
    }
    element.textContent = text;
    parent.append(element);
    return element;
}

async function getNewsData(path) {
    const response = await fetch(path, {
        headers: { Accept: "application/json" },
        cache: "no-store"
    });
    let data;

    try {
        data = JSON.parse(await response.text());
    } catch {
        throw new Error("API chưa hoạt động. Hãy triển khai website kèm Functions trên Cloudflare Pages.");
    }

    if (!response.ok) {
        throw new Error(data.error || `Máy chủ trả về mã ${response.status}.`);
    }

    return data;
}

function createNewsCard(article) {
    const card = document.createElement("article");
    card.className = "news-card";

    if (article.image) {
        const imageButton = document.createElement("button");
        imageButton.className = "news-image-button";
        imageButton.type = "button";
        imageButton.setAttribute("aria-label", `Đọc bài: ${article.title}`);

        const image = document.createElement("img");
        image.className = "news-image";
        image.src = article.image;
        image.alt = article.title;
        image.loading = "lazy";
        imageButton.append(image);
        imageButton.addEventListener("click", () => openArticle(article));
        card.append(imageButton);
    }

    addTextElement(card, "p", "card-label", article.date ? `Tin tức · ${article.date}` : "Tin tức nhà trường");

    const heading = document.createElement("h3");
    const title = addTextElement(heading, "button", "news-title-button", article.title);
    title.type = "button";
    title.addEventListener("click", () => openArticle(article));
    card.append(heading);

    if (article.summary) {
        addTextElement(card, "p", "news-summary", article.summary);
    }

    return card;
}

async function loadNews() {
    newsStatus.textContent = "Đang tải tin mới nhất từ website nhà trường...";

    try {
        const data = await getNewsData("/api/news");
        if (!Array.isArray(data.articles) || data.articles.length === 0) {
            throw new Error("Nguồn tin chưa trả về bài viết nào.");
        }

        newsList.replaceChildren(...data.articles.map(createNewsCard));
        newsStatus.hidden = true;
    } catch (error) {
        newsStatus.textContent = `Không tải được tin tức. ${error.message} Vui lòng thử tải lại trang sau.`;
    }
}

async function openArticle(article) {
    dialogTitle.textContent = article.title;
    dialogDate.textContent = article.date ? `Tin tức · ${article.date}` : "Tin tức nhà trường";
    const loadingMessage = document.createElement("p");
    loadingMessage.textContent = "Đang tải nội dung bài viết...";
    dialogContent.replaceChildren(loadingMessage);
    newsDialog.showModal();

    try {
        const data = await getNewsData(`/api/news?path=${encodeURIComponent(article.path)}`);
        if (!Array.isArray(data.paragraphs) || data.paragraphs.length === 0) {
            throw new Error("Bài viết chưa có nội dung để hiển thị.");
        }

        dialogTitle.textContent = data.title || article.title;
        dialogContent.replaceChildren(...data.paragraphs.map((paragraph) => {
            const element = document.createElement("p");
            element.textContent = paragraph;
            return element;
        }));
    } catch (error) {
        const errorMessage = document.createElement("p");
        errorMessage.textContent = `Không tải được nội dung bài viết. ${error.message}`;
        dialogContent.replaceChildren(errorMessage);
    }
}

document.querySelector("#news-dialog-close").addEventListener("click", () => newsDialog.close());
newsDialog.addEventListener("click", (event) => {
    if (event.target === newsDialog) {
        newsDialog.close();
    }
});

loadNews();
