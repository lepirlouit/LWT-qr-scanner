// Belgian National Register Number Validator
// Format: YYMMDD-XXX-CC where:
// - YYMMDD: Birth date (year, month, day)
// - XXX: Sequential number (odd for males, even for females)
// - CC: Check digits

export interface ValidationResult {
  isValid: boolean
  error?: string
  details?: {
    birthDate?: string
    gender?: "male" | "female"
    century?: "1900s" | "2000s"
  }
}

export function validateBelgianNationalNumber(input: string): ValidationResult {
  // Remove any spaces, dots, or dashes
  const cleaned = input.replace(/[\s.-]/g, "")

  // Check if input is empty
  if (!cleaned) {
    return { isValid: false, error: "National register number is required" }
  }

  // Must be exactly 11 digits
  if (!/^\d{11}$/.test(cleaned)) {
    return {
      isValid: false,
      error: "Must be exactly 11 digits (format: YYMMDDXXXCC)",
    }
  }

  // Extract parts: YYMMDD-XXX-CC
  const yearPart = cleaned.substring(0, 2)
  const monthPart = cleaned.substring(2, 4)
  const dayPart = cleaned.substring(4, 6)
  const sequencePart = cleaned.substring(6, 9)
  const checkDigits = cleaned.substring(9, 11)

  // Validate date components
  const year = Number.parseInt(yearPart)
  const month = Number.parseInt(monthPart)
  const day = Number.parseInt(dayPart)

  if (month < 1 || month > 12) {
    return { isValid: false, error: "Invalid month (must be 01-12)" }
  }

  if (day < 1 || day > 31) {
    return { isValid: false, error: "Invalid day (must be 01-31)" }
  }

  // Validate day for specific months
  const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  if (day > daysInMonth[month - 1]) {
    return { isValid: false, error: `Invalid day for month ${month.toString().padStart(2, "0")}` }
  }

  // Calculate check digits for both centuries
  const baseNumber = Number.parseInt(cleaned.substring(0, 9))

  // For people born in 1900s
  let remainder1900 = baseNumber % 97
  if (remainder1900 === 0) remainder1900 = 97
  const calculatedCheck1900 = 97 - remainder1900

  // For people born in 2000s (add 2000000000 to base number)
  const baseNumber2000 = baseNumber + 2000000000
  let remainder2000 = baseNumber2000 % 97
  if (remainder2000 === 0) remainder2000 = 97
  const calculatedCheck2000 = 97 - remainder2000

  const providedCheck = Number.parseInt(checkDigits)
  const isValid1900 = providedCheck === calculatedCheck1900
  const isValid2000 = providedCheck === calculatedCheck2000

  if (!isValid1900 && !isValid2000) {
    return {
      isValid: false,
      error: "Invalid check digits - number does not match Belgian format",
    }
  }

  // Determine gender from sequence number
  const sequenceNum = Number.parseInt(sequencePart)
  const gender = sequenceNum % 2 === 1 ? "male" : "female"

  // Determine most likely century
  const century = isValid2000 ? "2000s" : "1900s"

  // Format birth date for display
  const fullYear = century === "2000s" ? 2000 + year : 1900 + year
  const birthDate = `${dayPart}/${monthPart}/${fullYear}`

  return {
    isValid: true,
    details: {
      birthDate,
      gender,
      century,
    },
  }
}

export function formatBelgianNationalNumber(input: string): string {
  const cleaned = input.replace(/[\s.-]/g, "")
  if (cleaned.length !== 11) return input

  return `${cleaned.substring(0, 2)}.${cleaned.substring(2, 4)}.${cleaned.substring(4, 6)}-${cleaned.substring(6, 9)}.${cleaned.substring(9, 11)}`
}
