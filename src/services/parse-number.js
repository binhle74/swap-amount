const parser = (value) => {
  if (value === undefined) return value
  if (value === null) return value
  if (value === '') return value
  return Number(value)
}

export default parser
