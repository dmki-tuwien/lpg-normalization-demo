# LPG Normalization Frontend

This repository contains a [Next.js](https://nextjs.org)-based frontend for the LPG normalization REST API of <https://github.com/dmki-tuwien/lpg-normalization>.
In combination with that REST API, this frontend forms [GraNa-GraNo](https://github.com/dmki-tuwien/grana-grano), a demo for graph-native graph normalization.

## Development

As the frontend is based on Next.js which in turn runs on Node.js, please [install Node.js](https://nodejs.org/en/download) first.
Then install all dependencies and to run the development server by executing

```bash
npm install && npm run dev
```

The frontend is then made available on [http://localhost:3000](http://localhost:3000).

To modify the frontend, please edit the files in the `src/app` folder.
Apart from CSS styles, the main parts of the frontend are all located in `src/app/page.tsx`.
