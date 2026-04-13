# ALT---TEST-TECHNIQUE-Jour-5
ALT's technical test day 5

## Installation

### Prerequisites
- [Node] 18.20.2+
- [npm] 10.9.0+

### Commands
```bash
>npm install --no-cache
```

## Execution

### Running legacy code
```bash
>npm run legacy
```

### Running tests
```bash
>npm test
```

### Running refactored code
```bash
>npm run refactor
```

## Refactoring changes

### Config
- Added ESLint to limit error making. This is good future-proof practice. The config that goes with it has a simple setup.
- Renamed `tsconfig.json` to `tsconfig.base.json` to extend from it on other config files in order to have multiple `rootDir`
- Added `tsconfig.legacy.json` for `legacy`, `tsconfig.src.json` for `src` and `tsconfig.test.json` for `tests`
- Changed `tsconfig.base.json`'s `module` to ES2020 to match `target`

### File structure
- Added `/types` to create reusable throughout the project variable types
- Added `/constants` to add global variables to import where needed only
- Added `/utils` for simple reusable functions

### Logic
- `src/types/index.ts` defines shared data models for customers, orders, products, promotions and shipping zones
- `src/constants/index.ts` stores project-wide numeric settings like tax, shipping and discounts
- `src/utils/csv.ts` contains common CSV loading logic
- `src/utils/fetch.ts` parses CSV files into typed data structures
- `src/services/report.ts` contains the report-building and pricing logic
