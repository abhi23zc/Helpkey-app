/**
 * Phone Number Validation and Formatting Utility
 * Handles Indian phone numbers with comprehensive validation and formatting
 */

export interface PhoneValidationResult {
  isValid: boolean;
  formattedNumber: string;
  originalNumber: string;
  error?: string;
  countryCode: string;
  nationalNumber: string;
}

/**
 * Validates and formats phone numbers for WhatsApp notifications
 * Supports various input formats and ensures consistent output
 */
export class PhoneValidator {
  private static readonly COUNTRY_CODE = '91'; // India
  private static readonly VALID_PREFIXES = ['6', '7', '8', '9']; // Valid first digits for Indian mobile numbers
  private static readonly MOBILE_LENGTH = 10; // Length of Indian mobile numbers (without country code)

  /**
   * Main validation and formatting function
   */
  static validateAndFormat(input: string): PhoneValidationResult {
    const originalNumber = input;
    
    // Step 1: Clean the input
    const cleaned = this.cleanPhoneNumber(input);
    
    if (!cleaned) {
      return {
        isValid: false,
        formattedNumber: '',
        originalNumber,
        error: 'Phone number cannot be empty',
        countryCode: '',
        nationalNumber: ''
      };
    }

    // Step 2: Parse country code and national number
    const parsed = this.parsePhoneNumber(cleaned);
    
    // Step 3: Validate the parsed number
    const validation = this.validateParsedNumber(parsed);
    
    if (!validation.isValid) {
      return {
        isValid: false,
        formattedNumber: '',
        originalNumber,
        error: validation.error,
        countryCode: parsed.countryCode,
        nationalNumber: parsed.nationalNumber
      };
    }

    // Step 4: Format for WhatsApp API
    const formattedNumber = this.formatForWhatsApp(parsed);

    return {
      isValid: true,
      formattedNumber,
      originalNumber,
      countryCode: parsed.countryCode,
      nationalNumber: parsed.nationalNumber
    };
  }

  /**
   * Clean phone number by removing all non-digit characters
   */
  private static cleanPhoneNumber(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    // Remove all non-digit characters (spaces, dashes, parentheses, plus signs, etc.)
    return input.replace(/\D/g, '');
  }

  /**
   * Parse country code and national number from cleaned input
   */
  private static parsePhoneNumber(cleaned: string): { countryCode: string; nationalNumber: string } {
    // Case 1: Number starts with 91 (country code included)
    if (cleaned.startsWith('91') && cleaned.length === 12) {
      return {
        countryCode: '91',
        nationalNumber: cleaned.substring(2)
      };
    }

    // Case 2: Number starts with +91 or 0091 (already cleaned, so just 91)
    if (cleaned.startsWith('91') && cleaned.length > 10) {
      return {
        countryCode: '91',
        nationalNumber: cleaned.substring(2)
      };
    }

    // Case 3: Number starts with 0 (trunk prefix - remove it)
    if (cleaned.startsWith('0') && cleaned.length === 11) {
      return {
        countryCode: '91',
        nationalNumber: cleaned.substring(1)
      };
    }

    // Case 4: 10-digit number (assume Indian mobile)
    if (cleaned.length === 10) {
      return {
        countryCode: '91',
        nationalNumber: cleaned
      };
    }

    // Case 5: Other lengths - try to extract last 10 digits if valid
    if (cleaned.length > 10) {
      const last10 = cleaned.substring(cleaned.length - 10);
      return {
        countryCode: '91',
        nationalNumber: last10
      };
    }

    // Default case
    return {
      countryCode: '91',
      nationalNumber: cleaned
    };
  }

  /**
   * Validate the parsed phone number
   */
  private static validateParsedNumber(parsed: { countryCode: string; nationalNumber: string }): { isValid: boolean; error?: string } {
    const { countryCode, nationalNumber } = parsed;

    // Check country code
    if (countryCode !== this.COUNTRY_CODE) {
      return {
        isValid: false,
        error: `Only Indian numbers (+91) are supported. Found country code: +${countryCode}`
      };
    }

    // Check national number length
    if (nationalNumber.length !== this.MOBILE_LENGTH) {
      return {
        isValid: false,
        error: `Indian mobile numbers must be ${this.MOBILE_LENGTH} digits. Found ${nationalNumber.length} digits.`
      };
    }

    // Check if it starts with valid prefix
    const firstDigit = nationalNumber.charAt(0);
    if (!this.VALID_PREFIXES.includes(firstDigit)) {
      return {
        isValid: false,
        error: `Indian mobile numbers must start with ${this.VALID_PREFIXES.join(', ')}. Found: ${firstDigit}`
      };
    }

    // Check for obviously invalid patterns
    if (this.isInvalidPattern(nationalNumber)) {
      return {
        isValid: false,
        error: 'Phone number appears to be invalid (repeated digits or invalid pattern)'
      };
    }

    return { isValid: true };
  }

  /**
   * Check for invalid patterns (like all same digits)
   */
  private static isInvalidPattern(number: string): boolean {
    // Check for all same digits
    if (new Set(number).size === 1) {
      return true;
    }

    // Check for sequential patterns (1234567890, 0123456789)
    const isSequential = number.split('').every((digit, index) => {
      if (index === 0) return true;
      const prev = parseInt(number[index - 1]);
      const curr = parseInt(digit);
      return curr === (prev + 1) % 10;
    });

    if (isSequential) {
      return true;
    }

    return false;
  }

  /**
   * Format for WhatsApp API (country code + national number)
   */
  private static formatForWhatsApp(parsed: { countryCode: string; nationalNumber: string }): string {
    return `${parsed.countryCode}${parsed.nationalNumber}`;
  }

  /**
   * Format for display (with spaces and country code)
   */
  static formatForDisplay(phoneNumber: string): string {
    const result = this.validateAndFormat(phoneNumber);
    if (!result.isValid) {
      return phoneNumber; // Return original if invalid
    }

    const { countryCode, nationalNumber } = result;
    // Format as: +91 98765 43210
    return `+${countryCode} ${nationalNumber.substring(0, 5)} ${nationalNumber.substring(5)}`;
  }

  /**
   * Quick validation check (returns boolean only)
   */
  static isValid(phoneNumber: string): boolean {
    return this.validateAndFormat(phoneNumber).isValid;
  }

  /**
   * Get formatted number for API use
   */
  static getApiFormat(phoneNumber: string): string | null {
    const result = this.validateAndFormat(phoneNumber);
    return result.isValid ? result.formattedNumber : null;
  }

  /**
   * Batch validate multiple phone numbers
   */
  static validateBatch(phoneNumbers: string[]): PhoneValidationResult[] {
    return phoneNumbers.map(number => this.validateAndFormat(number));
  }

  /**
   * Get validation summary for debugging
   */
  static getValidationSummary(phoneNumber: string): string {
    const result = this.validateAndFormat(phoneNumber);
    
    if (result.isValid) {
      return `✅ Valid: ${result.formattedNumber} (Original: ${result.originalNumber})`;
    } else {
      return `❌ Invalid: ${result.error} (Original: ${result.originalNumber})`;
    }
  }
}

// Export convenience functions
export const validatePhoneNumber = PhoneValidator.validateAndFormat;
export const isValidPhoneNumber = PhoneValidator.isValid;
export const formatPhoneForApi = PhoneValidator.getApiFormat;
export const formatPhoneForDisplay = PhoneValidator.formatForDisplay;

// Export default
export default PhoneValidator;