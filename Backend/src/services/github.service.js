const env = require('../config/env');

/**
 * GitHub Integration Service
 * 
 * WHY:
 * 1. Automation: When configured with `AUTO_GITHUB_INVITE=true` and `GITHUB_TOKEN`, automatically
 *    invites buyers to the project's private GitHub repository upon confirmed payment.
 * 2. Least Privilege: Grants strictly read-only access (`permission: 'pull'`).
 * 3. Graceful Fallback: If GitHub API calls fail (e.g. rate limit, invalid username), records
 *    the error in `delivery.notes` and sets status to `failed` so the Owner can deliver manually
 *    without interrupting or reverting the paid status of the order.
 */

class GitHubService {
  /**
   * Invites a user as a read-only collaborator to a private repository
   * @param {object} params
   * @param {string} params.repoOwner - e.g. "ByteCraftDev"
   * @param {string} params.repoName - e.g. "mern-store-pro"
   * @param {string} params.username - buyer GitHub username
   * @returns {Promise<{ success: boolean, error?: string }>}
   */
  async inviteCollaborator({ repoOwner, repoName, username }) {
    if (!env.AUTO_GITHUB_INVITE || !env.GITHUB_TOKEN) {
      return {
        success: false,
        error: 'AUTO_GITHUB_INVITE is disabled or GITHUB_TOKEN is not configured.',
      };
    }

    if (!repoOwner || !repoName || !username) {
      return {
        success: false,
        error: 'Missing repo owner, repo name, or username.',
      };
    }

    try {
      const url = `https://api.github.com/repos/${encodeURIComponent(repoOwner)}/${encodeURIComponent(repoName)}/collaborators/${encodeURIComponent(username)}`;

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${env.GITHUB_TOKEN}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'ByteCraft-Backend',
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ permission: 'pull' }),
      });

      if (response.status === 201 || response.status === 204) {
        return { success: true };
      }

      const data = await response.json().catch(() => ({}));
      const errorMsg = data.message || `GitHub API responded with status ${response.status}`;
      return { success: false, error: errorMsg };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

module.exports = new GitHubService();
