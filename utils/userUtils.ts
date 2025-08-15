/**
 * Utility functions for user-related operations in multi-tenant environment
 */

/**
 * Strips the @factory suffix from username for display purposes
 * @param username - Full username in format "username@factory_name"
 * @returns Display username without @factory suffix
 */
export function displayUsername(username: string): string {
  if (!username) return '';
  return username.split('@')[0] || '';
}

/**
 * Extracts factory name from username
 * @param username - Full username in format "username@factory_name"
 * @returns Factory name or empty string if not found
 */
export function extractFactoryName(username: string): string {
  if (!username) return '';
  const parts = username.split('@');
  return parts.length > 1 ? parts[1] : '';
}

/**
 * Validates username format for multi-tenant
 * @param username - Username to validate
 * @returns True if username is in correct format (username@factory)
 */
export function isValidMultiTenantUsername(username: string): boolean {
  if (!username) return false;
  const parts = username.split('@');
  return parts.length === 2 && parts[0].length > 0 && parts[1].length > 0;
}

/**
 * Gets display name for user, preferring actual name over username
 * @param user - User object
 * @returns Display name (actual name if available, otherwise display username)
 */
export function getUserDisplayName(user: { name?: string; username: string }): string {
  return user.name || displayUsername(user.username);
}
