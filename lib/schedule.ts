export interface ScheduledPost {
  id: string;
  day: number;
  slot: 'AM' | 'PM';
  postType: string;
  bestTime: string;
  copy: string;
  goal: string;
  cta: string;
}

export const POST_SCHEDULE: ScheduledPost[] = [
  {
    id: 'd1-am',
    day: 1,
    slot: 'AM',
    postType: 'Value Drop',
    bestTime: '09:00',
    copy: `The biggest lie in the digital product space:

"You just need more traffic."

Nope.

You need an offer that converts before you spend a penny on traffic.

Here's how to know if yours does:
— Would you buy it from a stranger?
— Can you explain it in one sentence?
— Does it solve one specific problem?

If you answered no to any of those, the traffic won't help.`,
    goal: 'Build trust, no pitch',
    cta: 'None',
  },
  {
    id: 'd1-pm',
    day: 1,
    slot: 'PM',
    postType: 'Soft Promo',
    bestTime: '19:00',
    copy: `Something inside the playbook that people don't expect:

A built-in ROAS calculator.

Type in your product price, ad spend, and target margin — it tells you exactly what your conversion rate needs to be before you launch a single ad.

Most people skip this step entirely. Then wonder why ads don't work.

Playbook link in bio.`,
    goal: 'Product feature highlight',
    cta: 'Link in bio',
  },
  {
    id: 'd2-am',
    day: 2,
    slot: 'AM',
    postType: 'Mindset / Hook',
    bestTime: '08:30',
    copy: `Unpopular opinion:

Most digital product advice is designed for people who already have an audience.

If you have 50k followers, sure — just post and watch sales roll in.

If you have 200 followers and $200 to spend?

You need a completely different playbook.

One built for people starting with real constraints, not theoretical ones.`,
    goal: 'Relatability',
    cta: 'None',
  },
  {
    id: 'd2-pm',
    day: 2,
    slot: 'PM',
    postType: 'Story',
    bestTime: '18:30',
    copy: `The week I almost gave up on digital products:

$340 spent on ads.
0 sales.
Product page looked fine to me.

Turns out I had the steps backwards.

I was running ads to a page that hadn't been validated. To an audience I hadn't warmed up. With a price point I'd guessed.

The fix wasn't spending more. It was doing step 1 before step 3.

That sequence is now 18 sections long. Price goes up May 15.`,
    goal: 'Story to product bridge',
    cta: 'Soft deadline mention',
  },
  {
    id: 'd3-am',
    day: 3,
    slot: 'AM',
    postType: 'Quick Tip',
    bestTime: '09:00',
    copy: `If you're not sure your digital product will sell:

Test with a waitlist before you build.

Set up a simple landing page. Drive 50 people to it. See if 5 give you their email.

That's a 10% conversion — enough to justify building.

5 emails from cold traffic = real demand signal.

Most people skip this and build first. That's why most products don't sell.`,
    goal: 'Actionable tip',
    cta: 'None',
  },
  {
    id: 'd3-pm',
    day: 3,
    slot: 'PM',
    postType: 'FAQ Style',
    bestTime: '19:00',
    copy: `Q: Do I need a big audience to sell a digital product?

A: No. But you need a targeted one.

200 engaged followers in the right niche will outperform 20,000 random ones every time.

The playbook covers how to build that targeted audience from zero — even if you're starting with no following at all.

Section 4 specifically. One of the most referenced parts.`,
    goal: 'Objection handling',
    cta: 'Playbook mention',
  },
  {
    id: 'd4-am',
    day: 4,
    slot: 'AM',
    postType: 'Stat / Data',
    bestTime: '08:00',
    copy: `According to Gumroad's creator data:

60% of first-time digital product sellers never make a single sale.

Not because the market is saturated.
Not because they picked the wrong topic.

Because they launched without validating.

Validation isn't complicated. It takes 72 hours. It costs nothing.

It's step 1 of the playbook — and the step 90% of beginners skip.`,
    goal: 'Credibility + problem agitation',
    cta: 'Step 1 mention',
  },
  {
    id: 'd4-pm',
    day: 4,
    slot: 'PM',
    postType: 'Community Prompt',
    bestTime: '18:00',
    copy: `Quick question for anyone building a digital product:

What's the one thing holding you back from launching?

Drop it below — genuinely curious.

(I've heard everything from "I don't know how to price it" to "I'm scared nobody will buy it" — and every single one has a fix.)`,
    goal: 'Engagement',
    cta: 'Replies only',
  },
  {
    id: 'd5-am',
    day: 5,
    slot: 'AM',
    postType: 'How-To',
    bestTime: '09:00',
    copy: `How to price your digital product in 10 minutes:

1. Find 3 competitors selling something similar
2. Note their prices
3. Position yours in the middle tier unless you have social proof for premium
4. Pick a number that feels slightly uncomfortable to say out loud
5. Test it. You can always change it.

Pricing paralysis kills more launches than anything else.`,
    goal: 'Pure value',
    cta: 'None',
  },
  {
    id: 'd5-pm',
    day: 5,
    slot: 'PM',
    postType: 'Soft CTA',
    bestTime: '19:30',
    copy: `Use code LAUNCH before May 15.

After that the price goes from $97 to $150.

Not a fake deadline. The launch price is locked until the next update drops.

If you've been sitting on it, now's the time.

Playbook link in bio.`,
    goal: 'Deadline urgency',
    cta: 'LAUNCH code + link in bio',
  },
  {
    id: 'd6-am',
    day: 6,
    slot: 'AM',
    postType: 'Myth Bust',
    bestTime: '08:30',
    copy: `Myth: You need a course to make money selling digital products.

Reality: A well-positioned PDF or template can outperform a 6-hour course if it solves one painful problem clearly.

Complexity doesn't equal value.
Clarity does.

The fastest digital products to sell are the ones where the buyer knows exactly what they're getting in 10 seconds.`,
    goal: 'Reframe beliefs',
    cta: 'None',
  },
  {
    id: 'd6-pm',
    day: 6,
    slot: 'PM',
    postType: 'Behind the Scenes',
    bestTime: '18:00',
    copy: `What's actually inside the playbook:

01 Mindset & constraints
02 Niche validation framework
03 Offer construction
04 Audience building from zero
05 Product page anatomy
06 Pricing psychology
07 Pre-launch sequence
08 Launch day checklist
09 Ad creative framework
10 ROAS calculator
11 First 48 hours post-launch
12 Optimising your page
13 Email follow-up sequence
14 Scaling what works
15 Handling refunds
16 Month 2 growth plan
17 Tools & stack
18 30-day day-by-day roadmap

$97. Link in bio.`,
    goal: 'Transparency sell',
    cta: 'Link in bio',
  },
  {
    id: 'd7-am',
    day: 7,
    slot: 'AM',
    postType: 'Mindset',
    bestTime: '09:00',
    copy: `The most dangerous phrase in digital products:

"I'll launch when it's ready."

It's never ready.

A good-enough product in front of real buyers teaches you more in 7 days than 3 months of perfecting it alone.

Ship the imperfect thing. Refine with feedback.

That's the actual playbook.`,
    goal: 'Perfection paralysis',
    cta: 'None',
  },
  {
    id: 'd7-pm',
    day: 7,
    slot: 'PM',
    postType: 'Soft Promo',
    bestTime: '19:00',
    copy: `What happens when you follow the sequence instead of guessing:

Step 1 — validate before building → no wasted months
Step 2 — build the minimum product → launch in days not quarters
Step 3 — refine before running ads → know your conversion rate
Step 4 — launch with a plan → first sale within 30 days

This is the exact framework inside the playbook.

18 sections. One clear path.`,
    goal: 'Framework as proof',
    cta: 'Playbook mention',
  },
  {
    id: 'd8-am',
    day: 8,
    slot: 'AM',
    postType: 'Quick Tip',
    bestTime: '08:00',
    copy: `One thing you can do today to move closer to your first sale:

Write down the one problem your product solves.

Not the features. Not the sections. Not the bonuses.

The ONE problem.

If you can't do it in one sentence, the product isn't positioned yet.

Positioning is what makes someone read your page instead of scrolling past it.`,
    goal: 'Actionable',
    cta: 'None',
  },
  {
    id: 'd8-pm',
    day: 8,
    slot: 'PM',
    postType: 'Direct Promo',
    bestTime: '18:30',
    copy: `The From Zero to First Sale Playbook is for you if:

→ You have an idea but haven't validated it
→ You've tried launching and got silence
→ You're scared of wasting money on ads
→ You don't know what order to do things in
→ You want a 30-day plan, not more theory

Not for you if you want a get-rich-quick shortcut.

$97 one-time. Code LAUNCH for 30% off. Link in bio.`,
    goal: 'Qualify the buyer',
    cta: 'LAUNCH code + link',
  },
  {
    id: 'd9-am',
    day: 9,
    slot: 'AM',
    postType: 'Value Drop',
    bestTime: '09:00',
    copy: `The ad creative that converts cold traffic for digital products:

Hook: Lead with the problem, not the solution
Body: Show the before state — what life looks like without your product
Offer: Present the product as the bridge
CTA: One action. No options.

Most beginners lead with the product.
The best ads lead with the pain.

Simple switch. Completely different results.`,
    goal: 'Ad creative education',
    cta: 'None',
  },
  {
    id: 'd9-pm',
    day: 9,
    slot: 'PM',
    postType: 'Urgency',
    bestTime: '19:00',
    copy: `18 days until the price goes up.

May 15 is the hard deadline for the launch rate.

$97 → $150 when the next update drops.

If you've been thinking about it — this is the week.

Everything you need to go from idea to first sale in 30 days.

Link in bio. Code LAUNCH at checkout.`,
    goal: 'Countdown urgency',
    cta: 'Hard CTA + deadline',
  },
  {
    id: 'd10-am',
    day: 10,
    slot: 'AM',
    postType: 'Reflection',
    bestTime: '08:30',
    copy: `10 days ago I posted about the order of operations in digital products.

The replies told me everything:

Most people aren't stuck because they lack ideas.
They're stuck because nobody gave them the right sequence.

Validate. Build. Refine. Launch.

Four steps. In that order.

The playbook walks you through each one — day by day for 30 days.`,
    goal: 'Loop back to core message',
    cta: 'Subtle close',
  },
  {
    id: 'd10-pm',
    day: 10,
    slot: 'PM',
    postType: 'Final CTA',
    bestTime: '18:00',
    copy: `Last push before the price changes.

The From Zero to First Sale Playbook:

✓ 18 sections
✓ Built-in ROAS calculator
✓ 30-day action plan
✓ Ad creative templates
✓ AI validation prompt
✓ Lifetime access
✓ 30-day money-back guarantee

$97 today. $150 after May 15.

Code LAUNCH for 30% off — brings it to $67.90.

This is the last reminder.`,
    goal: 'Final close',
    cta: 'Strongest CTA',
  },
];

export function getTodaysPosts(startDate: string): ScheduledPost[] {
  const start = new Date(startDate + 'T00:00:00Z');
  const now = new Date();
  const todayUtc = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const diffDays =
    Math.floor((todayUtc.getTime() - start.getTime()) / 86_400_000) + 1;

  return POST_SCHEDULE.filter((post) => post.day === diffDays);
}

export function getDuePost(startDate: string): ScheduledPost | null {
  const now = new Date();
  const currentMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();

  const todaysPosts = getTodaysPosts(startDate);

  for (const post of todaysPosts) {
    const [h, m] = post.bestTime.split(':').map(Number);
    const postMinutes = h * 60 + m;
    if (Math.abs(currentMinutes - postMinutes) <= 5) {
      return post;
    }
  }

  return null;
}
