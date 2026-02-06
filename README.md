# DMKI Template Repo

The README.md file is the first file users of your software will see. In order to create a good first expression on users and to ease the use of the software the README.md file should contain:

* A very short (ideally 1-2 sentences) *description* of what the software contained in the repository does.
* A *getting started* section which explains how to use the software in practice within a few easy steps (e.g., pull docker container, and run it). This should also state how tests and experiments can be repeated.
* A link to the actual in-depth *documentation* of the source code. This documentation should be based on inline comments in the code as well as extra content located in the folder [`docs`](docs) explaining details.
* A *development* section that describes how to set up a development environment in order to be able to contribute.

Use a *`.gitignore`* file to remove caches, configuration files of IDEs, or sensitive variables, such as API keys, etc.
For a tidy project structure, on the top level of the repository only a limited number of files should be located. 
Please use the folders provided:
* `src` for source code
* `docs` for documentation
* `data` for data sets

Please do not forget to fill in the placeholders at the very top of the [license file](LICENSE.txt)!

The repository and the software contained in it should have an easy to memorize name, which needs to be agreed upon with your supervisor. 
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
