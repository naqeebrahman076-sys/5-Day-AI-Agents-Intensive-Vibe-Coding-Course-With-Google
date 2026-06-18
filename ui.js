import chalk from 'chalk';
import boxen from 'boxen';

/**
 * Calculates a human-readable relative time difference from a date string.
 * @param {string|Date} dateString - The target date
 * @returns {string} Relative time e.g., "5m ago", "3h ago"
 */
export function getRelativeTime(dateString) {
  if (!dateString) return 'unknown date';
  const now = new Date();
  const past = new Date(dateString);
  const diffMs = now - past;
  if (isNaN(diffMs)) return 'unknown date';

  const diffSecs = Math.floor(diffMs / 1000);
  if (diffSecs < 60) return 'just now';

  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 30) return `${diffDays}d ago`;

  // Fallback to standard local date
  return past.toLocaleDateString();
}

/**
 * Renders a single news article in a nice clean terminal snippet.
 */
export function formatArticle(article, index) {
  const num = chalk.bold.dim(`${index + 1}.`);
  const title = chalk.bold.white(article.title);
  const source = chalk.bgBlue.black(` ${article.source} `);
  const relativeTime = chalk.green(getRelativeTime(article.pubDate));
  const link = chalk.gray.underline(article.link);

  return `${num} ${title}\n   ${source}  •  ${relativeTime}\n   ${link}`;
}

/**
 * Renders a list of news articles with a header.
 */
export function displayNews(feedData) {
  const bannerContent = [
    chalk.bold.hex('#FF5733')('📰 GOOGLE NEWS CLI'),
    chalk.dim(feedData.title || 'Latest Headlines'),
    chalk.italic.gray(feedData.description || 'Google News RSS Feed')
  ].join('\n');

  const banner = boxen(bannerContent, {
    padding: 1,
    margin: { top: 1, bottom: 1 },
    borderColor: 'hex("#FF5733")',
    borderStyle: 'double',
    align: 'center'
  });

  console.log(banner);

  if (!feedData.articles || feedData.articles.length === 0) {
    console.log(chalk.red.bold('  No articles found. Try a different query or topic.'));
    console.log();
    return;
  }

  feedData.articles.forEach((article, index) => {
    console.log(formatArticle(article, index));
    console.log();
  });
}

/**
 * Displays error messages in a neat red box.
 */
export function displayError(message) {
  const errorBox = boxen(chalk.red.bold(`Error: ${message}`), {
    padding: 1,
    margin: 1,
    borderColor: 'red',
    borderStyle: 'round'
  });
  console.error(errorBox);
}
