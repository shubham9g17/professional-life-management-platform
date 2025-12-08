import { describe, it, expect } from 'vitest';
import { isValidEmail, validatePassword, hashPassword } from '../utils';
import { compare } from 'bcryptjs';

describe('Authentication Utils', () => {
  describe('isValidEmail', () => {
    it('should validate correct email formats', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('test.user@domain.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.com')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should accept strong passwords', () => {
      const result = validatePassword('StrongPass123');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject passwords that are too short', () => {
      const result = validatePassword('Short1');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('at least 8 characters');
    });

    it('should reject passwords without uppercase letters', () => {
      const result = validatePassword('lowercase123');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('uppercase letter');
    });

    it('should reject passwords without lowercase letters', () => {
      const result = validatePassword('UPPERCASE123');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('lowercase letter');
    });

    it('should reject passwords without numbers', () => {
      const result = validatePassword('NoNumbers');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('number');
    });
  });

  describe('hashPassword', () => {
    it('should hash passwords correctly', async () => {
      const password = 'TestPassword123';
      const hash = await hashPassword(password);

      // Hash should be different from original password
      expect(hash).not.toBe(password);

      // Hash should be verifiable with bcrypt
      const isValid = await compare(password, hash);
      expect(isValid).toBe(true);
    });

    it('should produce different hashes for the same password', async () => {
      const password = 'TestPassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      // Hashes should be different due to salt
      expect(hash1).not.toBe(hash2);

      // Both should be valid
      expect(await compare(password, hash1)).toBe(true);
      expect(await compare(password, hash2)).toBe(true);
    });
  });
});
