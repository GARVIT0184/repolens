const $ = id => document.getElementById(id);

const number = value => Number(value || 0).toLocaleString();

async function api(url) {
  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 404) throw new Error("Repository not found.");
    if (response.status === 403) throw new Error("GitHub API rate limit reached. Try again later.");
    throw new Error(`GitHub API error: ${response.status}`);
  }

  return response;
}

function getContributorEstimate(linkHeader, visibleCount) {
  if (!linkHeader) return visibleCount;

  const lastPage = linkHeader.match(
    /[?&]page=(\d+)[^>]*>;\s*rel="last"/
  );

  return lastPage ? Number(lastPage[1]) : visibleCount;
}

function calculateHealth(repo, hasReadme, contributorCount) {
  let score = 0;
  const factors = [];

  if (repo.description) {
    score += 15;
    factors.push("✓ Repository has a description (+15)");
  } else {
    factors.push("✗ Missing repository description (+0)");
  }

  if (hasReadme) {
    score += 25;
    factors.push("✓ README documentation exists (+25)");
  } else {
    factors.push("✗ README documentation missing (+0)");
  }

  if (repo.license) {
    score += 15;
    factors.push("✓ Open-source license detected (+15)");
  } else {
    factors.push("✗ No license detected (+0)");
  }

  const pushed = new Date(repo.pushed_at);
  const daysSinceUpdate = (Date.now() - pushed.getTime()) / 86400000;

  if (daysSinceUpdate <= 30) {
    score += 25;
    factors.push("✓ Updated within the last 30 days (+25)");
  } else if (daysSinceUpdate <= 180) {
    score += 15;
    factors.push("✓ Updated within the last 6 months (+15)");
  } else if (daysSinceUpdate <= 365) {
    score += 5;
    factors.push("✓ Updated within the last year (+5)");
  } else {
    factors.push("✗ No update in the last year (+0)");
  }

  if (contributorCount >= 5) {
    score += 20;
    factors.push("✓ Community contributions detected (+20)");
  } else if (contributorCount >= 1) {
    score += 10;
    factors.push("✓ Contributor activity detected (+10)");
  } else {
    factors.push("✗ No contributors detected (+0)");
  }

  return { score, factors };
}

function renderLanguages(languages) {
  const container = $("languageChart");
  const entries = Object.entries(languages || {})
    .sort((a, b) => b[1] - a[1]);

  if (!entries.length) {
    container.textContent = "No language data available.";
    return;
  }

  const total = entries.reduce((sum, item) => sum + item[1], 0);

  container.innerHTML = entries.map(([language, bytes]) => {
    const percentage = (bytes / total) * 100;

    return `
      <div class="language-row">
        <div class="language-label">
          <strong>${escapeHTML(language)}</strong>
          <span>${percentage.toFixed(1)}%</span>
        </div>
        <div class="language-track">
          <div class="language-fill" style="width:${percentage}%"></div>
        </div>
      </div>
    `;
  }).join("");
}

function renderContributors(contributors) {
  const container = $("contributors");

  if (!contributors.length) {
    container.textContent = "No contributor information available.";
    return;
  }

  container.innerHTML = contributors.map(person => `
    <div class="contributor">
      <img src="${escapeHTML(person.avatar_url)}" alt="">
      <a href="${escapeHTML(person.html_url)}" target="_blank" rel="noopener">
        ${escapeHTML(person.login)}
      </a>
      <span>${number(person.contributions)} contributions</span>
    </div>
  `).join("");
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

async function analyze() {
  const input = $("query").value.trim();
  const match = input.match(
    /(?:github\.com\/)?([^/\s]+)\/([^/\s#?]+)/i
  );

  if (!match) {
    $("status").textContent =
      "Enter a valid repository, e.g. facebook/react";
    return;
  }

  const owner = match[1];
  const repo = match[2].replace(/\.git$/, "");
  const base = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;

  $("status").textContent = "Scanning repository intelligence...";
  $("result").classList.add("hidden");
  $("analyzeBtn").disabled = true;

  try {
    const [
      repoResponse,
      languageResponse,
      contributorResponse,
      commitResponse,
      readmeResponse
    ] = await Promise.all([
      api(base),
      api(`${base}/languages`),
      api(`${base}/contributors?per_page=5`),
      api(`${base}/commits?per_page=5`),
      fetch(`${base}/readme`)
    ]);

    const data = await repoResponse.json();
    const languages = await languageResponse.json();
    const contributors = await contributorResponse.json();
    const commits = await commitResponse.json();

    const hasReadme = readmeResponse.ok;
    const contributorCount = getContributorEstimate(
      contributorResponse.headers.get("Link"),
      contributors.length
    );

    // Repository overview
    $("name").textContent = data.full_name;
    $("description").textContent =
      data.description || "No description provided.";
    $("stars").textContent = number(data.stargazers_count);
    $("forks").textContent = number(data.forks_count);
    $("watchers").textContent = number(data.subscribers_count);
    $("issues").textContent = number(data.open_issues_count);
    $("language").textContent = data.language || "Not specified";
    $("created").textContent =
      new Date(data.created_at).toLocaleDateString();
    $("repoLink").href = data.html_url;

    // Language distribution
    renderLanguages(languages);

    // Contributors
    $("contributorCount").textContent = number(contributorCount);
    $("contributorNote").textContent =
      "Estimated from GitHub's contributor pagination.";
    renderContributors(contributors);

    // Repository health
    const health = calculateHealth(
      data,
      hasReadme,
      contributorCount
    );

    $("healthScore").textContent = health.score;
    $("healthBar").style.width = `${health.score}%`;
    $("healthLabel").textContent =
      health.score >= 80 ? "Excellent signals" :
      health.score >= 60 ? "Good signals" :
      health.score >= 40 ? "Moderate signals" :
      "Needs attention";

    $("healthFactors").innerHTML = health.factors
      .map(item => `<li>${escapeHTML(item)}</li>`)
      .join("");

    // Recent commits
    $("commitList").innerHTML = commits.map(commit => `
      <div class="commit">
        ${escapeHTML(commit.commit.message.split("\n")[0])}
      </div>
    `).join("") || "<p>No recent commits available.</p>";

    $("result").classList.remove("hidden");
    $("status").textContent = "✓ Repository intelligence analysis complete.";

  } catch (error) {
    $("status").textContent = "⚠ " + error.message;
  } finally {
    $("analyzeBtn").disabled = false;
  }
}

$("analyzeBtn").addEventListener("click", analyze);

$("query").addEventListener("keydown", event => {
  if (event.key === "Enter") analyze();
});
