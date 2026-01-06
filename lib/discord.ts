const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID!;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET!;
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI!;

const DISCORD_API_ENDPOINT = 'https://discord.com/api/v10';

export interface DiscordUser {
    id: string;
    username: string;
    discriminator: string;
    avatar: string | null;
    email?: string;
    verified?: boolean;
}

export function getAuthorizationUrl(): string {
    const params = new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        redirect_uri: DISCORD_REDIRECT_URI,
        response_type: 'code',
        scope: 'identify', // We only need basic identity
        prompt: 'none',
    });

    return `${DISCORD_API_ENDPOINT}/oauth2/authorize?${params.toString()}`;
}

export async function getAccessToken(code: string): Promise<string> {
    const params = new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: DISCORD_REDIRECT_URI,
    });

    const response = await fetch(`${DISCORD_API_ENDPOINT}/oauth2/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
    });

    if (!response.ok) {
        const error = await response.json();
        console.error('Discord Token Error:', error);
        throw new Error('Failed to get access token');
    }

    const data = await response.json();
    return data.access_token;
}

export async function getUserProfile(accessToken: string): Promise<DiscordUser> {
    const response = await fetch(`${DISCORD_API_ENDPOINT}/users/@me`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        console.error('Discord Profile Error:', error);
        throw new Error('Failed to get user profile');
    }

    return response.json();
}

export function getAvatarUrl(user: DiscordUser): string {
    if (!user.avatar) {
        // Default Discord avatar based on discriminator
        const index = parseInt(user.discriminator) % 5;
        return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
    }
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;
}
