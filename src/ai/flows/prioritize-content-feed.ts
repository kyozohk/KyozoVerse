'use server';

/**
 * @fileOverview A flow that uses AI to prioritize content from all communities based on the user's interests.
 *
 * - prioritizeContentFeed - A function that handles the content prioritization process.
 * - PrioritizeContentFeedInput - The input type for the prioritizeContentFeed function.
 * - PrioritizeContentFeedOutput - The return type for the prioritizeContentFeed function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PrioritizeContentFeedInputSchema = z.object({
  interests: z
    .string()
    .describe('A comma-separated list of the user\u2019s interests.'),
  communityContent: z.array(z.string()).describe('An array of content from various communities.'),
});

export type PrioritizeContentFeedInput = z.infer<typeof PrioritizeContentFeedInputSchema>;

const PrioritizeContentFeedOutputSchema = z.object({
  prioritizedContent: z
    .array(z.string())
    .describe('An array of content, prioritized based on the user\u2019s interests.'),
});

export type PrioritizeContentFeedOutput = z.infer<typeof PrioritizeContentFeedOutputSchema>;

export async function prioritizeContentFeed(input: PrioritizeContentFeedInput): Promise<PrioritizeContentFeedOutput> {
  return prioritizeContentFeedFlow(input);
}

const prioritizeContentFeedPrompt = ai.definePrompt({
  name: 'prioritizeContentFeedPrompt',
  input: {schema: PrioritizeContentFeedInputSchema},
  output: {schema: PrioritizeContentFeedOutputSchema},
  prompt: `You are an AI assistant designed to prioritize content from various communities based on a user's interests.

  The user's interests are: {{{interests}}}

  The content from various communities is as follows:
  {{#each communityContent}}{{{this}}}\n{{/each}}

  Prioritize the content based on how well it matches the user's interests.  Return only the prioritized content, do not include any other text or explanation.
  Make sure to return all the content, just re-ordered.
  `,
});

const prioritizeContentFeedFlow = ai.defineFlow(
  {
    name: 'prioritizeContentFeedFlow',
    inputSchema: PrioritizeContentFeedInputSchema,
    outputSchema: PrioritizeContentFeedOutputSchema,
  },
  async input => {
    const {output} = await prioritizeContentFeedPrompt(input);
    return output!;
  }
);
