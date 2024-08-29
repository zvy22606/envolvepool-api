Launch Pool Service
========

This is a service for Launch Pool.


## Getting Started

First, setup development server:

```bash
npm ci
```

Then setup environment variables. 

- First copy `.env.example` to `.env`:
- And change the values in `.env` to your own.

Then, run the development server:

```bash
npm run dev
```

The service is running on [http://localhost:3000](http://localhost:3000).


## Test

Our test is based on [Jest](https://jestjs.io/). You can run it with:

```bash
npm run test
```

We don't aim for high test coverage, but when bugs occur, we need necessary
test cases to ensure that the problem has been fixed, and won't happen again.
