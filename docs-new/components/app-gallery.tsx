'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface App {
	id: string;
	name: string;
	category: string;
	icon?: string;
	info?: string;
	link?: string;
}

export default function AppGallery() {
	const [apps, setApps] = useState<App[]>([]);
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedCategory, setSelectedCategory] = useState('all');
	const [categories, setCategories] = useState<Set<string>>(new Set(['all']));
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		async function fetchApps() {
			try {
				const response = await fetch('/api/apps');
				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}
				const data = await response.json();
				if (data.error) {
					throw new Error(data.error);
				}
				if (!Array.isArray(data)) {
					throw new Error('Expected an array of apps but got something else');
				}

				const validApps = data.filter((app: App) => app?.id && app?.name);
				setApps(validApps);

				const newCategories = new Set(['all']);
				data.forEach((app: App) => {
					if (app?.category) {
						newCategories.add(app.category);
					}
				});
				setCategories(new Set([...newCategories].sort()));
			} catch (error) {
				console.error('Error loading apps:', error);
				setApps([]);
				setCategories(new Set(['all']));
			} finally {
				setIsLoading(false);
			}
		}
		fetchApps();
	}, []);

	const filteredApps = useMemo(() => {
		return apps.filter((app) => {
			if (!app?.id || !app?.name) return false;
			const matchesSearch =
				app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				app.id.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesCategory = selectedCategory === 'all' || app.category === selectedCategory;
			return matchesSearch && matchesCategory;
		});
	}, [apps, searchQuery, selectedCategory]);

	function clearSearch(e: React.MouseEvent) {
		e.preventDefault();
		setSearchQuery('');
	}

	function formatCategory(category: string): string {
		return category
			.split('_')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}

	return (
		<div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
			<div className="mb-12 text-center">
				<h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
					Apps You Can Install
				</h2>
				<p className="mx-auto max-w-2xl text-lg text-muted-foreground">
					Browse and install your favorite applications with one click
				</p>
			</div>

			<div className="mb-8 space-y-4">
				<div className="relative mx-auto max-w-md">
					<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
						<Search className="h-5 w-5 text-muted-foreground" />
					</div>
					<input
						type="text"
						className="block w-full rounded-lg border border-border bg-background py-3 pr-10 pl-10 text-foreground placeholder-muted-foreground transition-all ease-in-out focus:border-transparent focus:ring-2 focus:ring-primary focus:outline-none"
						placeholder={`Search ${apps.length} apps...`}
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
					{searchQuery && (
						<button
							className="absolute inset-y-0 right-0 flex items-center pr-3"
							onClick={clearSearch}
						>
							<X className="h-5 w-5 text-muted-foreground hover:text-foreground" />
						</button>
					)}
				</div>

				<p className="text-center text-sm text-muted-foreground">
					Request more apps{' '}
					<a
						href="https://github.com/Parcoil/Sparkle/issues/new/choose"
						target="_blank"
						rel="noopener noreferrer"
						className="text-primary hover:underline"
					>
						here
					</a>
				</p>
				<div className="flex flex-wrap justify-center gap-2">
					<Button
						className={`rounded-full px-4 py-2 text-sm font-medium ${
							selectedCategory === 'all'
								? 'bg-primary text-primary-foreground'
								: 'bg-muted text-muted-foreground hover:bg-muted/80'
						}`}
						onClick={(e) => {
							e.preventDefault();
							setSelectedCategory('all');
						}}
					>
						All Apps
					</Button>
					{Array.from(categories)
						.filter((cat) => cat !== 'all')
						.map((category) => (
							<Button
								key={category}
								className={`rounded-full px-4 py-2 text-sm font-medium ${
									selectedCategory === category
										? 'bg-primary text-primary-foreground'
										: 'bg-muted text-muted-foreground hover:bg-muted/80'
								}`}
								onClick={(e) => {
									e.preventDefault();
									setSelectedCategory(category);
								}}
							>
								{formatCategory(category)}
							</Button>
						))}
				</div>
			</div>

			{isLoading ? (
				<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
					{Array(8)
						.fill(0)
						.map((_, i) => (
							<div key={i} className="h-40 animate-pulse rounded-xl bg-muted/30 p-6">
								<div className="mb-4 h-6 w-3/4 rounded bg-muted"></div>
								<div className="mb-4 h-4 w-1/2 rounded bg-muted"></div>
								<div className="h-10 w-10 rounded-full bg-muted"></div>
							</div>
						))}
				</div>
			) : filteredApps.length > 0 ? (
				<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
					{filteredApps.map((app) => (
						<div
							key={app.id}
							className="group relative flex h-full flex-col rounded-xl border border-border bg-card transition-shadow duration-200 hover:shadow-lg"
						>
							<div className="flex h-full flex-col p-6">
								<div className="flex-1">
									<div className="mb-4 flex items-start justify-between">
										<div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted/80">
											{app.icon && (
												<img
													src={app.icon}
													alt={`${app.name} icon`}
													className="h-8 w-8 object-contain"
													onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
														e.currentTarget.style.display = 'none';
													}}
												/>
											)}
										</div>
										<span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
											{formatCategory(app.category || 'other')}
										</span>
									</div>
									<h3 className="mb-2 line-clamp-1 text-lg font-semibold text-foreground">
										{app.name}
									</h3>
									{app.info && (
										<p className="line-clamp-3 text-sm text-muted-foreground">{app.info}</p>
									)}
								</div>
								<div className="mt-4 border-t border-border/50 pt-4">
									<Button
										asChild
										className="inline-flex w-full items-center justify-center px-4 py-2 text-sm"
									>
										<a href={app.link} target="_blank" rel="noopener noreferrer">
											Visit Website
										</a>
									</Button>
								</div>
							</div>
						</div>
					))}
				</div>
			) : (
				<div className="py-12 text-center">
					<div className="mx-auto mb-4 h-12 w-12 text-muted-foreground">
						<Search className="h-full w-full" />
					</div>
					<h3 className="text-lg font-medium text-foreground">No apps found</h3>
					<p className="mt-1 text-sm text-muted-foreground">
						Try adjusting your search or filter to find what you're looking for.
					</p>
					{(searchQuery || selectedCategory !== 'all') && (
						<Button
							className="mt-4"
							onClick={(e) => {
								e.preventDefault();
								setSearchQuery('');
								setSelectedCategory('all');
							}}
						>
							Clear all filters
						</Button>
					)}
				</div>
			)}
		</div>
	);
}
