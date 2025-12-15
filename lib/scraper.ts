import * as cheerio from 'cheerio';

export type ScrapeResult = {
    success: boolean;
    data?: {
        title: string;
        price: string;
        image: string;
        rating: string;
        metrics?: {
            imageCount: number;
            bulletCount: number;
            descriptionLength: number;
            hasAPlusContent: boolean;
        };
        review?: {
            title: string;
            body: string;
            rating: string;
        };
        ratingDistribution?: Record<string, string>;
    };
    error?: string;
    statusCode?: number;
};

export async function scrapeAmazonProduct(url: string): Promise<ScrapeResult> {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
            },
            cache: 'no-store',
        });

        if (response.status === 503) {
            return {
                success: false,
                statusCode: 503,
                error: 'Amazon detected bot activity (503 Service Unavailable). This confirms the need for a specialized Scraping API.',
            };
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Check for CAPTCHA
        if ($('form[action="/errors/validateCaptcha"]').length > 0) {
            return {
                success: false,
                statusCode: 200,
                error: 'Blocked by Amazon CAPTCHA "Wall". This confirms the need for a specialized Scraping API.',
            };
        }

        // Attempt to extract data (selectors might change, but these are common)
        const title = $('#productTitle').text().trim();

        // Price selector is tricky and varies. Trying multiple common ones.
        let price = $('.a-price .a-offscreen').first().text().trim();
        if (!price) {
            price = $('#price_inside_buybox').text().trim();
        }
        if (!price) {
            price = $('.a-price .a-text-price').first().text().trim();
        }

        const image = $('#landingImage').attr('src') || '';
        const rating = $('#acrPopover').attr('title') || $('.a-icon-alt').first().text().trim();

        // Quality Metrics Extraction
        // 1. Image Count (Thumbnails)
        const imageCount = $('#altImages ul li').length || 1; // Default to 1 if main image exists

        // 2. Bullet Points (Feature List)
        const bulletPoints: string[] = [];
        $('#feature-bullets ul li span.a-list-item').each((_, el) => {
            const text = $(el).text().trim();
            if (text) bulletPoints.push(text);
        });

        // 3. Description Length
        const description = $('#productDescription').text().trim() || $('#aplus').text().trim();
        const descriptionLength = description.length;

        // 4. Extract Reviews & Prioritize Critical Feedback
        // Instead of taking just the first one, we grab the first 5 and pick the lowest rated one.
        const reviews: { title: string; body: string; rating: string; star: number }[] = [];

        $('div[data-hook="review"]').each((i, el) => {
            if (i > 5) return; // Limit to top 5
            const title = $(el).find('a[data-hook="review-title"]').text().trim();
            const body = $(el).find('span[data-hook="review-body"]').text().trim() ||
                $(el).find('.review-text-content').text().trim();
            const ratingText = $(el).find('i[data-hook="review-star-rating"]').text().trim();

            // Parse rating (e.g. "5.0 out of 5 stars" -> 5)
            const ratingMatch = ratingText.match(/(\d+(\.\d+)?)/);
            const star = ratingMatch ? parseFloat(ratingMatch[0]) : 5;

            if (title && body) {
                reviews.push({ title, body, rating: ratingText, star });
            }
        });

        // Sort by star (Low to High) to find the most critical one
        reviews.sort((a, b) => a.star - b.star);
        const topCriticalReview = reviews[0];

        // 5. Extract Rating Histogram (Star Balance)
        // Table with rows like "5 star ... 70%"
        const ratingDistribution: Record<string, string> = {};

        // Try multiple selectors for the histogram rows
        let histogramRows = $('#histogramTable tr');
        if (histogramRows.length === 0) {
            histogramRows = $('.a-histogram-row');
        }
        if (histogramRows.length === 0) {
            histogramRows = $('[data-hook="histogram-row"]');
        }

        histogramRows.each((_, el) => {
            // Structure is usually: "5 star" (label) ... bar ... "70%" (percentage)
            // Sometimes it's a link with aria-label or just text
            let starLabel = $(el).find('td:nth-child(1)').text().trim();
            let percentage = $(el).find('td:nth-child(3)').text().trim();

            // Fallback for different layouts (e.g. div based)
            if (!percentage) {
                const textContent = $(el).text();
                // Regex to find "5 star" and "20%" kind of patterns if structure is flat
                // But generally .a-histogram-row has specific children.
                // Let's try finding the percentage directly via class if the table structure didn't work
                percentage = $(el).find('.a-text-right a').text().trim() ||
                    $(el).find('.a-text-right').text().trim();

                starLabel = $(el).first().text().trim(); // Rough attempt
            }

            if (percentage) {
                // Normalize key: "5 star" -> "5", "5つ星" -> "5"
                const starKeyMatch = $(el).text().match(/(\d)(?=\s*(star|つ星))/); // Look for digit before "star" or "つ星"
                const starKey = starKeyMatch ? starKeyMatch[1] : null;

                // Normalize percentage: "70%" -> "70%"
                const percentMatch = percentage.match(/\d+%/);

                if (starKey && percentMatch) {
                    ratingDistribution[starKey] = percentMatch[0];
                }
            }
        });

        // Fallback: If table extraction failed (keys < 5), try regex on the whole review container text
        if (Object.keys(ratingDistribution).length === 0) {
            const reviewHtml = $('#reviewsMedley').html() || $('body').html() || '';
            // Regex for "5 star" ... "70%" pattern (simplified)
            // It often appears as "5つ星のうち 5.0" (Rating) vs "5つ星 70%" (Histogram)
            // We look for: (Digit) (star/つ星) ... (Digit)%

            ['5', '4', '3', '2', '1'].forEach(star => {
                // Pattern: star + "star" or "つ星" ... something ... digit + "%"
                // We limit the "something" to avoid jumping too far
                const regex = new RegExp(`${star}(?:star|つ星)[^%]{0,100}?(\\d+)%`, 'i');
                const match = reviewHtml.match(regex);
                if (match) {
                    ratingDistribution[star] = match[1] + '%';
                }
            });
        }

        if (!title) {
            return {
                success: false,
                statusCode: 200,
                error: 'Loaded page but could not find Product Title. Layout might be different or content is dynamic.'
            }
        }

        // 6. Deep Fetch: If no critical review found (all top reviews are > 3 stars), fetch the specialized "Critical Reviews" page.
        // This is "Agentic behavior" - going deeper to find the truth.
        let deepReview = topCriticalReview;

        // If we didn't find a review < 4 stars, try to fetch the critical reviews page
        if (!deepReview || deepReview.star >= 4) {
            try {
                // Extract ASIN from URL
                const asinMatch = url.match(/\/(dp|gp\/product)\/([A-Z0-9]{10})/);
                if (asinMatch && asinMatch[2]) {
                    const asin = asinMatch[2];
                    const criticalUrl = `https://www.amazon.co.jp/product-reviews/${asin}/ref=cm_cr_arp_d_viewopt_sr?ie=UTF8&filterByStar=critical&sortBy=recent`;

                    const reviewRes = await fetch(criticalUrl, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                            'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
                        },
                        cache: 'no-store'
                    });

                    if (reviewRes.ok) {
                        const reviewHtml = await reviewRes.text();
                        const $review = cheerio.load(reviewHtml);

                        // Extract first review from this critical page
                        const rEl = $review('div[data-hook="review"]').first();
                        if (rEl.length > 0) {
                            const title = rEl.find('a[data-hook="review-title"]').text().trim();
                            const body = rEl.find('span[data-hook="review-body"]').text().trim();
                            const ratingText = rEl.find('i[data-hook="review-star-rating"]').text().trim();
                            const star = parseFloat(ratingText.match(/(\d+(\.\d+)?)/)?.[0] || '1');

                            if (title && body) {
                                deepReview = { title, body, rating: ratingText, star };
                                // Also try to get histogram from this page if we missed it
                                if (Object.keys(ratingDistribution).length === 0) {
                                    $review('#histogramTable tr').each((_, el) => {
                                        const starLabel = $review(el).find('td:nth-child(1)').text().trim();
                                        const percentage = $review(el).find('td:nth-child(3)').text().trim();
                                        const starKey = starLabel.match(/\d+/)?.[0];
                                        const percentMatch = percentage.match(/\d+%/);
                                        if (starKey && percentMatch) ratingDistribution[starKey] = percentMatch[0];
                                    });
                                }
                            }
                        }
                    }
                }
            } catch (e) {
                // Ignore deep fetch errors, fallback to main page data
                console.error("Deep fetch failed", e);
            }
        }

        return {
            success: true,
            data: {
                title,
                price,
                image,
                rating,
                metrics: {
                    imageCount,
                    bulletCount: bulletPoints.length,
                    descriptionLength,
                    hasAPlusContent: $('#aplus').length > 0
                },
                review: deepReview ? {
                    title: deepReview.title,
                    body: deepReview.body,
                    rating: deepReview.rating
                } : undefined,
                ratingDistribution
            },
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown network error',
        };
    }
}
