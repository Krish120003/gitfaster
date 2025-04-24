<div align="center" style="text-wrap: balance;">
<!-- ![Gitfaster](./public/project-logo.png) -->
<img src="./public/project-logo.png" alt="Gitfaster Logo">
<div>Gitfaster is a minimal, blazing fast client to make GitHub feel modern again.</div>
</div>

## Demo

<!-- https://github.com/user-attachments/assets/ee143c0e-e5d8-417f-a0c7-02da55a9d235 -->

<div align="center">
    <video src="https://github.com/user-attachments/assets/ee143c0e-e5d8-417f-a0c7-02da55a9d235" controls style="max-height: 600px; margin: auto;"></video>
</div>

Check it out live at [gitfaster.vercel.app](https://gitfaster.dev)

Once you are logged in, you can also replace any `github.com` URL with `githubf.com` to switch to GithubF[aster].

## Speed

This project is a submission to the [Next.js Global Hackathon](https://x.com/nextjs/status/1907878486636675413), for the speed category.

Gitfaster was created out of personal frustration with GitHub's slow navigation. I often browse repositories to learn or reference examples, but GitHub's Multi-Page Application makes it painfully slow to navigate quickly - even when I already know exactly which file or directory I'm looking for.

Gitfaster directly addresses this issue by prioritizing speed and responsiveness. It achieves this through two primary optimizations:

- **Efficient Caching**: GitHub API responses are cached intelligently to minimize redundant requests, drastically improving load times.

- **Predictive Prefetching**: When a user visits a page, we already know all the possible links they might navigate to next. In theory, we could fetch all of these pages in the background to make navigation instantaneous. However, prefetching every visible link would be resource-intensive and inefficient. To optimize performance, Gitfaster employs a "just-in-time" prefetching strategy by loading content early when the user hovers over a link. This approach ensures that the next page loads instantly upon clicking, delivering an exceptionally snappy experience without unnecessary resource consumption.

The end result is a much faster and more enjoyable experience for quickly navigating and referencing code.

## Installation

1.  Clone the repository:

    ```sh
    git clone https://github.com/krish120003/gitfaster.git
    ```

2.  Navigate to the project directory:

    ```sh
    cd gitfaster
    ```

3.  Install the dependencies using pnpm:

    ```sh
    pnpm install
    ```

4.  Create a `.env` file based on the `.env.example` file and fill in the required environment variables:

    ```sh
    cp .env.example .env
    ```

    Make sure to configure the following variables:

    - `AUTH_SECRET`: Generate a new secret using `openssl rand -base64 64`.
    - `GITHUB_ID`: Your GitHub application client ID.
    - `GITHUB_SECRET`: Your GitHub application client secret.
    - `DATABASE_URL`: PostgreSQL database connection URL.
    - `REDIS_URL`: Redis connection URL.
    - `GITHUB_TOKEN`: GitHub Personal Access Token.

5.  Start the local database using Docker (optional):

    ```sh
    ./start-database.sh
    ```

6.  Push the Drizzle schema to the database:

    ```sh
    pnpm db:push
    ```

7.  Start the development server:

    ```sh
    pnpm dev
    ```
