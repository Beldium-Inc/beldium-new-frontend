# Welcome to your Lovable project

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm, [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

The portal talks to the Beldium Django API. Copy `.env.example` to `.env` and set
`VITE_API_URL` to the API origin (defaults to `http://localhost:8000`). The API must
list this portal's origin in its portal and CORS allow-lists, or sign-in fails with
`portal_undetermined`. See `src/lib/api/README.md`.

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS
