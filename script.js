
const queryInput = document.getElementById("query");
const statusElement = document.getElementById("status");
const resultElement = document.getElementById("result");
const analyzeButton = document.querySelector(".search button");

async function analyze() {
    const input = queryInput.value.trim();

    const match = input.match(
        /(?:github\.com\/)?([^/\s]+)\/([^/\s#?]+)/i
    );

    if (!match) {
        statusElement.textContent =
            "Enter a valid repository, e.g. facebook/react";
        resultElement.classList.add("hidden");
        return;
    }

    const owner = match[1];
    const repo = match[2].replace(/\.git$/, "");

    statusElement.textContent = "Scanning repository...";
    resultElement.classList.add("hidden");
    analyzeButton.disabled = true;
    analyzeButton.textContent = "Analyzing...";

    try {
        const baseURL =
            `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;

        const [repoResponse, commitsResponse] = await Promise.all([
            fetch(baseURL),
            fetch(`${baseURL}/commits?per_page=5`)
        ]);

        if (!repoResponse.ok) {
            if (repoResponse.status === 404) {
                throw new Error("Repository not found.");
            }

            if (repoResponse.status === 403) {
                throw new Error(
                    "GitHub API rate limit reached. Try again later."
                );
            }

            throw new Error(`GitHub API error: ${repoResponse.status}`);
        }

        if (!commitsResponse.ok) {
            throw new Error(
                `Could not load recent commits: ${commitsResponse.status}`
            );
        }

        const data = await repoResponse.json();
        const commits = await commitsResponse.json();

        document.getElementById("name").textContent = data.full_name;

        document.getElementById("description").textContent =
            data.description || "No description provided.";

        document.getElementById("stars").textContent =
            data.stargazers_count.toLocaleString();

        document.getElementById("forks").textContent =
            data.forks_count.toLocaleString();

        document.getElementById("watchers").textContent =
            data.subscribers_count.toLocaleString();

        document.getElementById("issues").textContent =
            data.open_issues_count.toLocaleString();

        document.getElementById("language").textContent =
            data.language || "Not specified";

        document.getElementById("created").textContent =
            new Date(data.created_at).toLocaleDateString();

        const repoLink = document.getElementById("repoLink");
        repoLink.href = data.html_url;

        const commitList = document.getElementById("commitList");
        commitList.replaceChildren();

        if (commits.length === 0) {
            const message = document.createElement("p");
            message.textContent = "No recent commits available.";
            commitList.appendChild(message);
        } else {
            commits.forEach(commit => {
                const item = document.createElement("div");
                item.className = "commit";

                item.textContent =
                    commit.commit.message.split("\n")[0];

                commitList.appendChild(item);
            });
        }

        resultElement.classList.remove("hidden");
        statusElement.textContent =
            "✓ Repository analysis complete.";

    } catch (error) {
        statusElement.textContent = "⚠ " + error.message;

    } finally {
        analyzeButton.disabled = false;
        analyzeButton.textContent = "Analyze ↗";
    }
}

queryInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        analyze();
    }
});
