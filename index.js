#!/usr/bin/env node

import { program } from 'commander';
import prompts from 'prompts';
import { fetchNews } from './newsService.js';
import { displayNews, displayError } from './ui.js';

// Setup commander flags
program
  .name('google-news-cli')
  .description('Retrieve latest Google News from terminal')
  .version('1.0.0')
  .option('-s, --search <query>', 'Search for specific news keywords')
  .option('-t, --topic <topic>', 'Fetch news for a specific topic (world, technology, business, science, health, sports, entertainment)')
  .option('-l, --limit <number>', 'Number of news items to fetch (default: 10)', (val) => parseInt(val, 10), 10)
  .option('-c, --country <country>', 'Country code (e.g. US, IN, GB)', 'US')
  .option('-g, --lang <lang>', 'Language code (e.g. en)', 'en');

program.parse(process.argv);

const options = program.opts();

// Simple keypress helper to pause the menu loop
async function pressAnyKeyToContinue() {
  console.log();
  await prompts({
    type: 'invisible',
    name: 'continue',
    message: 'Press Enter to return to the main menu...'
  });
}

// Interactive menu mode
async function runInteractive(config) {
  const currentConfig = { ...config };
  
  while (true) {
    console.clear();
    const response = await prompts({
      type: 'select',
      name: 'action',
      message: 'Choose what news you want to retrieve:',
      choices: [
        { title: '🔥 Top Headlines', value: 'top' },
        { title: '🔍 Search by Keyword', value: 'search' },
        { title: '📂 Browse by Topic', value: 'topic' },
        { title: '⚙️ Settings (Region & Language)', value: 'settings' },
        { title: '❌ Exit', value: 'exit' }
      ],
      initial: 0
    });

    if (!response.action || response.action === 'exit') {
      console.log('\nGoodbye! Keep reading.');
      break;
    }

    if (response.action === 'top') {
      try {
        console.log('\nFetching top headlines...');
        const feed = await fetchNews({
          gl: currentConfig.gl,
          hl: currentConfig.hl,
          limit: currentConfig.limit
        });
        displayNews(feed);
      } catch (err) {
        displayError(err.message);
      }
      await pressAnyKeyToContinue();
    } else if (response.action === 'search') {
      const searchPrompt = await prompts({
        type: 'text',
        name: 'query',
        message: 'Enter search keyword(s):',
        validate: val => val.trim().length > 0 ? true : 'Please enter a search keyword'
      });
      if (searchPrompt.query) {
        try {
          console.log(`\nSearching for "${searchPrompt.query}"...`);
          const feed = await fetchNews({
            search: searchPrompt.query,
            gl: currentConfig.gl,
            hl: currentConfig.hl,
            limit: currentConfig.limit
          });
          displayNews(feed);
        } catch (err) {
          displayError(err.message);
        }
        await pressAnyKeyToContinue();
      }
    } else if (response.action === 'topic') {
      const topicPrompt = await prompts({
        type: 'select',
        name: 'topic',
        message: 'Select a topic:',
        choices: [
          { title: 'World', value: 'WORLD' },
          { title: 'Nation', value: 'NATION' },
          { title: 'Business', value: 'BUSINESS' },
          { title: 'Technology', value: 'TECHNOLOGY' },
          { title: 'Entertainment', value: 'ENTERTAINMENT' },
          { title: 'Sports', value: 'SPORTS' },
          { title: 'Science', value: 'SCIENCE' },
          { title: 'Health', value: 'HEALTH' }
        ]
      });
      if (topicPrompt.topic) {
        try {
          console.log(`\nFetching ${topicPrompt.topic.toLowerCase()} news...`);
          const feed = await fetchNews({
            topic: topicPrompt.topic,
            gl: currentConfig.gl,
            hl: currentConfig.hl,
            limit: currentConfig.limit
          });
          displayNews(feed);
        } catch (err) {
          displayError(err.message);
        }
        await pressAnyKeyToContinue();
      }
    } else if (response.action === 'settings') {
      console.log(`\nCurrent Region: ${currentConfig.gl} | Language: ${currentConfig.hl} | Limit: ${currentConfig.limit}\n`);
      
      const settingsPrompt = await prompts([
        {
          type: 'select',
          name: 'region',
          message: 'Select region:',
          choices: [
            { title: 'United States (US)', value: { gl: 'US', hl: 'en' } },
            { title: 'India (IN)', value: { gl: 'IN', hl: 'en' } },
            { title: 'United Kingdom (GB)', value: { gl: 'GB', hl: 'en' } },
            { title: 'Canada (CA)', value: { gl: 'CA', hl: 'en' } },
            { title: 'Australia (AU)', value: { gl: 'AU', hl: 'en' } },
            { title: 'Custom (enter manually)', value: 'custom' }
          ]
        }
      ]);

      if (settingsPrompt.region === 'custom') {
        const customPrompt = await prompts([
          {
            type: 'text',
            name: 'gl',
            message: 'Enter two-letter country code (gl) (e.g., US, IN, FR):',
            initial: currentConfig.gl,
            validate: val => val.trim().length === 2 ? true : 'Must be exactly 2 letters'
          },
          {
            type: 'text',
            name: 'hl',
            message: 'Enter language code (hl) (e.g., en, fr):',
            initial: currentConfig.hl,
            validate: val => val.trim().length >= 2 ? true : 'Must be at least 2 letters'
          }
        ]);
        if (customPrompt.gl && customPrompt.hl) {
          currentConfig.gl = customPrompt.gl.toUpperCase();
          currentConfig.hl = customPrompt.hl.toLowerCase();
        }
      } else if (settingsPrompt.region) {
        currentConfig.gl = settingsPrompt.region.gl;
        currentConfig.hl = settingsPrompt.region.hl;
      }

      const limitPrompt = await prompts({
        type: 'number',
        name: 'limit',
        message: 'Enter default number of articles to display (1-50):',
        initial: currentConfig.limit,
        min: 1,
        max: 50
      });
      if (limitPrompt.limit) {
        currentConfig.limit = limitPrompt.limit;
      }
    }
  }
}

// Entry point logic
const main = async () => {
  // If the user specified any arguments/flags other than the program name
  // Note: commander sets options even if default, so we check process.argv for flags.
  // We check if process.argv has options, or if help was requested.
  const hasArguments = process.argv.length > 2;

  if (hasArguments) {
    try {
      const feed = await fetchNews({
        search: options.search,
        topic: options.topic,
        gl: options.country,
        hl: options.lang,
        limit: options.limit
      });
      displayNews(feed);
    } catch (err) {
      displayError(err.message);
    }
  } else {
    await runInteractive({
      gl: options.country,
      hl: options.lang,
      limit: options.limit
    });
  }
};

main();
