const GITHUB_RAW_URL =
	'https://raw.githubusercontent.com/Parcoil/Sparkle/refs/heads/v2/src/renderer/src/assets/apps.json';

export async function GET() {
	try {
		const response = await fetch(GITHUB_RAW_URL, {
			headers: {
				'User-Agent': 'Sparkle-Site/1.0',
				Accept: 'application/json',
			},
		});

		if (!response.ok) {
			return Response.json(
				{ error: `GitHub API responded with status: ${response.status}` },
				{ status: 500 }
			);
		}

		let data;
		try {
			data = await response.json();
		} catch {
			return Response.json({ error: 'Failed to parse JSON response from GitHub' }, { status: 500 });
		}

		const appsArray = Array.isArray(data) ? data : data?.apps;

		if (!Array.isArray(appsArray)) {
			return Response.json(
				{ error: 'Expected an array of apps or an object with an apps array' },
				{ status: 500 }
			);
		}

		return Response.json(appsArray, {
			headers: {
				'Cache-Control': 'public, max-age=3600',
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*',
			},
		});
	} catch (error) {
		return Response.json(
			{
				error: 'Failed to fetch apps',
				details: error instanceof Error ? error.message : 'Unknown error',
			},
			{
				status: 500,
				headers: {
					'Access-Control-Allow-Origin': '*',
				},
			}
		);
	}
}
