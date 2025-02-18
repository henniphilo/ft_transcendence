document.addEventListener("DOMContentLoaded", () => {
    const templates = [
        document.getElementById("template-1"),
        document.getElementById("template-2"),
        document.getElementById("template-3")
    ];
    let currentIndex = 0;
    const contentDiv = document.getElementById("content");
    const switchButton = document.getElementById("switch-button");

    function showTemplate(index) {
        contentDiv.innerHTML = "";
        const clone = templates[index].content.cloneNode(true);
        contentDiv.appendChild(clone);
    }

    switchButton.addEventListener("click", () => {
        currentIndex = (currentIndex + 1) % templates.length;
        showTemplate(currentIndex);
    });

    showTemplate(currentIndex);
});
