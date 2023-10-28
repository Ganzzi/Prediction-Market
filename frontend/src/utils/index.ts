function milisecondsToDate(milliseconds: any) {
  const date = new Date(stringToNumber(milliseconds) ?? NaN)

  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0') // January is 0
  const year = date.getFullYear().toString() // Get last two digits of the year

  return `${day}-${month}-${year}`
}

function stringToNumber(price: string | number): number | null {
  if (typeof price == 'number') {
    return price
  }

  if (typeof price == 'string') {
    const priceWithoutCommas = price.replace(/,/g, '') // Remove commas if present
    const priceNumber = parseFloat(priceWithoutCommas)

    if (isNaN(priceNumber)) {
      return null // Return null for invalid inputs
    }

    return priceNumber
  }
  return null
}

function dateToMilliseconds(dateString: string): number {
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(year, month - 1, day)

  return date.getTime()
}

function toDecimal(price: number, decimals: number): number {
  return (stringToNumber(price) ?? 0) * 10 ** decimals
}

function fromDecimal(price: number, decimals: number): number {
  return (stringToNumber(price) ?? 0) / 10 ** decimals
}

const shorttenAddress = (input: string, prefixLength: number, suffixLength: number): string => {
  if (input?.length <= prefixLength + suffixLength) {
    return input
  }

  const prefix = input.slice(0, prefixLength)
  const suffix = input.slice(-suffixLength)
  return `${prefix}...${suffix}`
}

function parsePrice(price: string, decimals: number): number | null {
  const priceWithoutCommas = price.replace(/,/g, '') // Remove commas if present
  const priceNumber = parseFloat(priceWithoutCommas)

  if (isNaN(priceNumber) || typeof decimals !== 'number' || decimals === 0) {
    return null // Return null for invalid inputs
  }

  return priceNumber / 10 ** decimals
}

export {
  dateToMilliseconds,
  fromDecimal,
  milisecondsToDate,
  parsePrice,
  shorttenAddress,
  stringToNumber,
  toDecimal,
}
