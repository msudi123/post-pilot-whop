import { getWhopSdk } from './whop';

function parseWhopCreatedAt(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value > 1e12 ? value : value * 1000;
  }

  if (typeof value === 'string') {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) {
      return numeric > 1e12 ? numeric : numeric * 1000;
    }

    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return 0;
}

async function findForumExperienceId(companyId: string): Promise<string> {
  const forums = await getWhopSdk().forums.list({ company_id: companyId });

  // Prefer forums open to everyone, fall back to first available
  const open = forums.data.find((f) => f.who_can_post === 'everyone');
  const forum = open ?? forums.data[0];

  if (!forum?.experience?.id) {
    throw new Error('No forum found for this company. Make sure your Whop community has a forum experience.');
  }

  return forum.experience.id;
}

export async function postToForum(
  experienceId: string,
  content: string,
  companyId?: string
): Promise<{ id: string }> {
  let targetExperienceId = experienceId && experienceId !== 'public' ? experienceId : null;

  if (!targetExperienceId) {
    if (!companyId) throw new Error('companyId is required when no experienceId is set');
    targetExperienceId = await findForumExperienceId(companyId);
  }

  function rewriteWhopError(err: unknown) {
    const message = err instanceof Error ? err.message : String(err || 'Whop forum post create failed');
    if (!message.toLowerCase().includes('forum:post:create')) {
      return new Error(message);
    }

    const installUrl = process.env.WHOP_APP_ID
      ? `https://whop.com/apps/${process.env.WHOP_APP_ID}/install`
      : '';

    return new Error(
      installUrl
        ? `Whop rejected forum posting because forum:post:create is not fully authorized for this actor. Make sure the app has that permission requested and approved for the company, then install or re-approve it here: ${installUrl}`
        : 'Whop rejected forum posting because forum:post:create is not fully authorized for this actor. Make sure the app has that permission requested and approved for the target company, then install or re-approve the app.'
    );
  }

  const client = getWhopSdk();
  let created: { id: string };
  try {
    created = (await client.forumPosts.create({
      experience_id: targetExperienceId,
      content,
      pinned: false,
      is_mention: false,
    })) as { id: string };
  } catch (err) {
    throw rewriteWhopError(err);
  }

  const fresh = await client.forumPosts.retrieve(created.id);
  const createdAt = parseWhopCreatedAt((fresh as any)?.created_at);
  const recentEnough = createdAt > Date.now() - 10 * 60 * 1000;

  if (!recentEnough) {
    throw new Error('Whop did not confirm a fresh forum post creation');
  }

  return created;
}
