# repolens

# ◈ REPOLENS

### Understand any repository.

RepoLens is a lightweight GitHub intelligence dashboard that fetches
live repository information using the GitHub REST API.

## Features

- Repository information and description
- Live star, fork and watcher counts
- Open issue statistics
- Primary programming language
- Repository creation date
- Recent commit activity
- Direct GitHub repository access
- Responsive dark-themed interface

## Tech Stack

- HTML5
- CSS3
- JavaScript (Vanilla)
- GitHub REST API
- GitHub Pages

## Project Structure

```text
repolens/
├── index.html
├── style.css
├── script.js
└── README.md
```

## Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/GARVIT0184/repolens.git
   ```

2. Open the project folder:

   ```bash
   cd repolens
   ```

3. Open `index.html` in your browser.

No backend or API key is required for basic public repository lookups.

## Usage

Enter a GitHub repository in this format:

```text
facebook/react
```

Click Analyze to retrieve repository information.

## API

RepoLens uses the GitHub REST API:

```text
https://api.github.com/repos/{owner}/{repo}
```

Recent commits:

```text
https://api.github.com/repos/{owner}/{repo}/commits
```

Unauthenticated GitHub API requests are subject to rate limits.

## Live Demo

https://garvit0184.github.io/repolens/

## Author

**GARVIT0184**

Built as a lightweight project exploring REST APIs,
JavaScript and repository analytics.

## License

MIT License
