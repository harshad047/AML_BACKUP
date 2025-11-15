import { Injectable } from '@angular/core';
import * as bcrypt from 'bcryptjs';

@Injectable({
  providedIn: 'root'
})
export class PasswordHashService {
  private readonly SALT_ROUNDS = 12;

  constructor() {}

  async hashPassword(password: string): Promise<string> {
    if (!password || password.trim().length === 0) {
      throw new Error('Password cannot be empty');
    }

    try {
      // Generate salt and hash password
      const salt = await bcrypt.genSalt(this.SALT_ROUNDS);
      const hashedPassword = await bcrypt.hash(password.trim(), salt);
      return hashedPassword;
    } catch (error) {
      console.error('Error hashing password:', error);
      throw new Error('Failed to hash password');
    }
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    if (!password || !hash) {
      return false;
    }

    try {
      return await bcrypt.compare(password.trim(), hash);
    } catch (error) {
      console.error('Error verifying password:', error);
      return false;
    }
  }

  async generateSalt(rounds: number = this.SALT_ROUNDS): Promise<string> {
    try {
      return await bcrypt.genSalt(rounds);
    } catch (error) {
      console.error('Error generating salt:', error);
      throw new Error('Failed to generate salt');
    }
  }

  async hashPasswordWithSalt(password: string, salt: string): Promise<string> {
    if (!password || !salt) {
      throw new Error('Password and salt are required');
    }

    try {
      return await bcrypt.hash(password.trim(), salt);
    } catch (error) {
      console.error('Error hashing password with salt:', error);
      throw new Error('Failed to hash password with salt');
    }
  }
}
