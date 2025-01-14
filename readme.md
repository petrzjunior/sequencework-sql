<img src="logo.png" alt="sql``" width="109" height="65"><br>

### javascript template literals to format sql, fork of [@sequencework/sql](https://github.com/sequencework/sql)

Transforms a template literal in an object that can be read by [node-postgres](https://github.com/brianc/node-postgres).

### Fork features

- Fixes `instanceof` behaviour with multiple `require` calls by adding a type tag

### Features

- Written in [Typescript](#usage-with-typescript)
- Lightweight (less than 50 lines of code)
- Fully tested (100% coverage)
- Works with **nested sql tags**
- Works with **conditions inside expressions**
- Compatible with [node-postgres](https://github.com/brianc/node-postgres), with a useful [shorthand](#shorthand-fo-postgres)

### Installation

```
npm install sequencework-sql-global --save
```

(or with **yarn**, `yarn add sequencework-sql-global`)

### Usage

```js
const sql = require('sequencework-sql-global')

const yearRange = [1983, 1992]

const query = sql`
  select * from movies
  where 
    year >= ${yearRange[0]} 
    and year <= ${yearRange[1]}
`

// query looks like this:
// {
//  text: 'select * from books where author = $1 and year = $2',
//  values: [1983, 1992]
// }
```

You can also use conditions:

```js
const sql = require('sequencework-sql-global')

const findBookByAuthor = author => sql`
  select * from books
  ${
    // if author is undefined, it is ignored in the query
    author && sql`where author = ${author}`
  }
`

// findBookByAuthor() looks like this:
// {
//  text: 'select * from books',
//  values: []
// }

// findBookByAuthor('steinbeck') looks like this:
// {
//  text: 'select * from books where author = $1',
//  values: ['steinbeck']
// }
```

⚠️ The expression will only be ignored if it returns `undefined`. If it is `false`, it will be added as a value.

```js
const filterThisYear = false

// does not work as expected
sql`
  select * from books
  ${filterThisYear && sql`where year = 2018`}
`

// instead you should do
sql`
  select * from books
  ${filterThisYear ? sql`where year = 2018` : undefined}
`
```

It's also possible to pass raw, unescaped data to your queries. For that, use `sql.raw`:

```js
const tableName = 'books'
const query = sql`select * from ${sql.raw(tableName)}`
```

💥 Please, be careful! Remember that the raw values won't be replaced by a placeholder and thus won't be escaped!

### Example with [node-postgres](https://github.com/brianc/node-postgres)

We start by creating a function:

```js
// movies.js
const sql = require('sequencework-sql-global')

const listMoviesByYear = async (db, yearRange) => {
  const { rows } = await db.query(sql`
    select * from movies
    where 
      year >= ${yearRange[0]} 
      and year <= ${yearRange[1]}
  `)

  return rows
}

module.exports = { listMoviesByYear }
```

Then, we create a singleton for the connection pool, like [recommended by brianc](https://node-postgres.com/guides/project-structure), node-postgres's creator.

```js
// db.js
const { Pool } = require('pg')
// we create a singleton here for the connection pool
const db = new Pool()

module.exports = db
```

Finally, we connect everything:

```js
// main.js
const db = require('./db')
const { listMoviesByYear } = require('./movies')

const main = async () => {
  const movies = await listMoviesByYear(db, [1983, 1992])

  console.log(movies)
}

main()
```

We can even create a **transaction** (useless in this example, but it's just to show that our previous function is reusable):

```js
const main = async () => {
  // we get a client
  const client = await db.connect()

  try {
    await client.query('BEGIN')

    const movies = await listMoviesByYear(client, [1983, 1992])

    await client.query('COMMIT')
  } catch (e) {
    await client.query('ROLLBACK')
  } finally {
    client.release()
  }

  console.log(movies)
}
```

#### Shorthand for postgres

Since we ❤️ [node-postgres](https://github.com/brianc/node-postgres) so much, we created shorthands and helpers for it:

```js
const sql = require('sequencework-sql-global/pg') // ⚠️ we import sequencework-sql-global/pg

// main export stays the same
const query = sql`select * from movies where id = ${id}`

// sql.raw is also there
const booksTable = 'books'
const booksQuery = sql`select * from ${sql.raw(booksTable)}`

// default pg result object: https://node-postgres.com/api/result
const { rows, rowCount } = await sql.query(db)`select * from movies`

// helpers
const movies = await sql.many(db)`select * from movies`
const movie = await sql.one(db)`select * from movies where id = ${id}`
const nbMovie = await sql.count(
  db
)`update from movies set name = ${name} where id = ${id}`
```

You can then rewrite the previous `listMoviesByYear` function in a much more concise way 😎

```js
const sql = require('sequencework-sql-global/pg') // ⚠️ we import sequencework-sql-global/pg

const listMoviesByYear = async (db, yearRange) => sql.many(db)`
  select * from movies
  where 
    year >= ${yearRange[0]} 
    and year <= ${yearRange[1]}
`
```

### Usage with TypeScript

`sql` comes with its TypeScript declaration file. You can directly use it within your TypeScript projects:

```ts
import sql = require('sequencework-sql-global')

const yearRange: ReadonlyArray<number> = [1983, 1992]

const query = sql`
  select * from movies
  where
    year >= ${yearRange[0]}
    and year <= ${yearRange[1]}
`
```

### More

This package is inspired by the great [sql-template-strings](https://github.com/felixfbecker/node-sql-template-strings). Some interesting features that we were missing:

- nested `sql` tags
- ignore `undefined` expressions in `sql`

So we made this 🙂
