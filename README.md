<div align="center" style="text-wrap: balance;">
<!-- ![Gitfaster](./public/project-logo.png) -->
<img src="./public/project-logo.png" alt="Gitfaster Logo">
<div>Gitfaster is a minimal, blazing fast client to make GitHub feel modern again.</div>
</div>


https://github.com/user-attachments/assets/ee143c0e-e5d8-417f-a0c7-02da55a9d235


### Installation

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
