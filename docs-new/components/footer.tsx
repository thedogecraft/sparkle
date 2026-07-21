import commit from './commit';

export default function Footer() {
	return (
		<footer className="flex w-full items-center justify-center gap-2 bg-primary/10 p-4 text-center text-sm text-muted-foreground dark:bg-accent/10">
			<p>
				a{' '}
				<a href="https://parcoil.com" className="text-primary hover:underline">
					parcoil
				</a>{' '}
				site
			</p>
			<a href="mailto:info@parcoil.com" className="text-primary hover:underline">
				info@parcoil.com
			</a>
			<span className="text-xs opacity-50">• {commit}</span>
		</footer>
	);
}
