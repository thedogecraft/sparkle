export async function GET() {
	const url = 'https://raw.githubusercontent.com/Parcoil/Sparkle/v2/get.ps1';
	const res = await fetch(url);
	if (!res.ok) {
		return new Response('File not found', { status: 404 });
	}
	const text = await res.text();
	const encoder = new TextEncoder();
	const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
	const encoded = encoder.encode(text);

	const fileData = new Uint8Array(bom.length + encoded.length);
	fileData.set(bom, 0);
	fileData.set(encoded, bom.length);

	return new Response(fileData, {
		headers: {
			'Content-Type': 'text/plain; charset=UTF-8',
			'Content-Disposition': 'attachment; filename="get.ps1"',
		},
	});
}
