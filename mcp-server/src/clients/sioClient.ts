/**
 * CMU SIO Schedule Scraper
 * Uses Playwright to scrape class schedule from Student Information Online
 */

import { chromium, type Browser, type Page } from "playwright";
import type { SioSchedule } from "../models/SioTypes.js";
import { env } from "../utils/env.js";
import * as logger from "../utils/logger.js";
import { mockSioSchedule } from "./fixtures/mockSioResponse.js";

export class SioClient {
  private username: string;
  private password: string;
  private useMock: boolean;

  constructor(username?: string, password?: string, useMock?: boolean) {
    this.username = username || env.sioUsername;
    this.password = password || env.sioPassword;
    this.useMock = useMock ?? env.mockSio;
  }

  /**
   * Fetch current semester schedule
   */
  async fetchCurrentSchedule(): Promise<SioSchedule> {
    if (this.useMock) {
      logger.info("Using mock SIO data");
      return mockSioSchedule;
    }

    logger.info("Fetching schedule from SIO (this may take a moment)...");

    let browser: Browser | null = null;
    try {
      browser = await chromium.launch({
        headless: true,
      });

      const context = await browser.newContext();
      const page = await context.newPage();

      // Navigate to SIO
      await page.goto("https://s3.andrew.cmu.edu/sio/");

      // Login
      await this.login(page);

      // Navigate to schedule page
      const schedule = await this.scrapeSchedule(page);

      await browser.close();
      logger.info(`Fetched ${schedule.entries.length} schedule entries from SIO`);
      return schedule;
    } catch (error) {
      logger.error("Failed to fetch SIO schedule", error);
      if (browser) {
        await browser.close();
      }
      throw error;
    }
  }

  /**
   * Login to SIO
   */
  private async login(page: Page): Promise<void> {
    try {
      logger.debug("Logging in to SIO...");

      // Wait for login form
      await page.waitForSelector('input[name="user"]', { timeout: 10000 });

      // Fill in credentials
      await page.fill('input[name="user"]', this.username);
      await page.fill('input[name="password"]', this.password);

      // Submit form
      await page.click('input[type="submit"]');

      // Wait for navigation after login
      await page.waitForLoadState("networkidle");

      logger.debug("Successfully logged in to SIO");
    } catch (error) {
      logger.error("SIO login failed", error);
      throw new Error("Failed to login to SIO. Check credentials.");
    }
  }

  /**
   * Scrape schedule from SIO page
   *
   * NOTE: This is a simplified implementation. The actual SIO HTML structure
   * may vary. You'll need to inspect the real SIO pages and adjust selectors.
   */
  private async scrapeSchedule(page: Page): Promise<SioSchedule> {
    try {
      logger.debug("Navigating to schedule page...");

      // Navigate to student schedule
      // TODO: Update this URL/navigation based on actual SIO structure
      await page.goto("https://s3.andrew.cmu.edu/sio/schedule.html");
      await page.waitForLoadState("networkidle");

      // Extract schedule data
      // TODO: Update these selectors based on actual SIO HTML structure
      const entries = await page.evaluate(() => {
        const scheduleEntries: Array<any> = [];

        // This is a placeholder implementation
        // You'll need to inspect the actual SIO page and write appropriate selectors
        // @ts-expect-error - document is available in Playwright browser context
        const rows = document.querySelectorAll("table.schedule tr");

        rows.forEach((row: any, index: number) => {
          const cells = row.querySelectorAll("td");
          if (cells.length >= 6) {
            // Example parsing - adjust based on actual table structure
            const courseCode = cells[0]?.textContent?.trim() || "";
            const courseTitle = cells[1]?.textContent?.trim() || "";
            const days = cells[2]?.textContent?.trim() || "";
            const time = cells[3]?.textContent?.trim() || "";
            const location = cells[4]?.textContent?.trim() || "";
            const instructor = cells[5]?.textContent?.trim() || "";

            // Parse time range (e.g., "10:00-10:50")
            const timeMatch = time.match(/(\d{1,2}:\d{2})-(\d{1,2}:\d{2})/);
            const startTime = timeMatch?.[1] || "00:00";
            const endTime = timeMatch?.[2] || "00:00";

            if (courseCode) {
              scheduleEntries.push({
                id: `${courseCode}-${index}`,
                courseCode,
                courseTitle,
                meetingType: "Lecture", // Determine from column if available
                days,
                startTime,
                endTime,
                location,
                instructor,
              });
            }
          }
        });

        return scheduleEntries;
      });

      // Determine current term
      const term = await this.getCurrentTerm(page);

      return {
        term,
        entries,
        fetchedAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error("Failed to scrape SIO schedule", error);
      throw new Error("Failed to scrape schedule from SIO");
    }
  }

  /**
   * Extract current term from SIO page
   */
  private async getCurrentTerm(page: Page): Promise<string> {
    try {
      // Try to find term information on the page
      // TODO: Update selector based on actual SIO structure
      const term = await page.evaluate(() => {
        // @ts-expect-error - document is available in Playwright browser context
        const termElement = document.querySelector(".term, .semester");
        return termElement?.textContent?.trim() || "";
      });

      if (term) {
        return term;
      }

      // Fallback: determine term from current date
      const now = new Date();
      const month = now.getMonth();
      const year = now.getFullYear().toString().slice(-2);

      if (month >= 8 || month <= 0) {
        return `F${year}`;
      } else if (month >= 1 && month <= 4) {
        return `S${year}`;
      } else {
        return `M${year}`;
      }
    } catch (error) {
      logger.error("Failed to determine current term", error);
      return "Unknown";
    }
  }
}

/**
 * Default SIO client instance using environment variables
 */
export const sioClient = new SioClient();
