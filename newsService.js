import Parser from 'rss-parser';

const parser = new Parser();

const TOPICS = {
  WORLD: 'WORLD',
  NATION: 'NATION',
  BUSINESS: 'BUSINESS',
  TECHNOLOGY: 'TECHNOLOGY',
  ENTERTAINMENT: 'ENTERTAINMENT',
  SPORTS: 'SPORTS',
  SCIENCE: 'SCIENCE',
  HEALTH: 'HEALTH'
};

/**
 * Normalizes user-entered topic strings into Google News RSS topic keys.
 */
function normalizeTopic(topicStr) {
  if (!topicStr) return null;
  const upper = topicStr.toUpperCase();
  if (TOPICS[upper]) return TOPICS[upper];
  
  // Custom aliases
  const aliases = {
    'TECH': 'TECHNOLOGY',
    'BIZ': 'BUSINESS',
    'NATIONAL': 'NATION',
    'POLITICS': 'NATION'
  };
  return aliases[upper] || null;
}

/**
 * Fetches news from Google News RSS.
 * 
 * @param {Object} options
 * @param {string} [options.search] Search query keyword
 * @param {string} [options.topic] News topic (WORLD, TECHNOLOGY, etc.)
 * @param {string} [options.gl='US'] Country code (e.g. US, IN, GB)
 * @param {string} [options.hl='en'] Language code (e.g. en)
 * @param {number} [options.limit=10] Maximum number of articles to return
 */
export async function fetchNews(options = {}) {
  const {
    search,
    topic,
    gl = 'US',
    hl = 'en',
    limit = 10
  } = options;

  let url = 'https://news.google.com/rss';
  const ceid = `${gl}:${hl}`;

  const queryParams = new URLSearchParams({
    hl,
    gl,
    ceid
  });

  const normalizedTopic = normalizeTopic(topic);

  if (search) {
    queryParams.set('q', search);
    url = `https://news.google.com/rss/search?${queryParams.toString()}`;
  } else if (normalizedTopic) {
    url = `https://news.google.com/rss/headlines/section/topic/${normalizedTopic}?${queryParams.toString()}`;
  } else {
    url = `https://news.google.com/rss?${queryParams.toString()}`;
  }

  try {
    const feed = await parser.parseURL(url);
    
    // Parse articles
    const articles = feed.items.slice(0, limit).map(item => {
      // Google News titles are typically: "Headline - Source Name"
      // Let's attempt to separate the title from the source.
      let title = item.title || '';
      let source = 'Google News';
      
      const lastDashIndex = title.lastIndexOf(' - ');
      if (lastDashIndex !== -1) {
        source = title.substring(lastDashIndex + 3).trim();
        title = title.substring(0, lastDashIndex).trim();
      }

      return {
        title,
        source,
        link: item.link,
        pubDate: item.pubDate,
        dateObject: item.pubDate ? new Date(item.pubDate) : null
      };
    });

    return {
      title: feed.title || 'Google News',
      description: feed.description || '',
      articles
    };
  } catch (error) {
    throw new Error(`Failed to retrieve news from Google: ${error.message}`);
  }
}
