import { IPGQueryConfig, Sql, SqlContainer } from './utils'

function sqlText(
  count: number,
  chains: ReadonlyArray<string>,
  expressions: any[]
): IPGQueryConfig {
  let text = chains[0]
  const values = []

  for (let i = 0; i < expressions.length; i++) {
    const expression = expressions[i]

    if (expression === undefined) {
      // if expression is undefined, just skip it
      text += chains[i + 1]
    } else if (
      expression &&
      typeof expression === 'object' &&
      typeof expression._sql === 'object' &&
      typeof expression._sql.isSqlContainer === 'function' &&
      expression._sql.isSqlContainer()
    ) {
      // if expression is a sub `sql` template literal
      const {
        text: _text,
        values: _values,
        _sql: { count: _count }
      } = sqlText(count, expression._sql.chains, expression._sql.expressions)
      count = _count
      text += _text + chains[i + 1]
      values.push(..._values)
    } else {
      // if expression is a simple value
      text += `$${count}` + chains[i + 1]
      values.push(expression)
      count++
    }
  }

  return {
    _sql: new SqlContainer(chains, expressions, count),
    text,
    values
  }
}

const sql: Sql = ((chains, ...expressions) =>
  sqlText(1, chains, expressions)) as Sql

sql.raw = rawData => sqlText(1, [rawData], [])

export = sql
