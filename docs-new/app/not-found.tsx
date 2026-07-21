'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Download, ChevronDown, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem
} from '@/components/ui/dropdown-menu';
import Footer from '@/components/footer';

export default function NotFoundPage() {
	const [version, setVersion] = useState('');

	useEffect(() => {
		async function fetchVersion() {
			try {
				const response = await fetch(
					'https://api.github.com/repos/parcoil/sparkle/releases/latest'
				);
				const data = await response.json();
				setVersion(data.tag_name);
			} catch (error) {
				console.error('Failed to fetch version:', error);
			}
		}
		fetchVersion();
	}, []);

	function handleDownload(type: 'exe' | 'zip') {
		if (type === 'exe') {
			window.open(
				`https://github.com/Parcoil/Sparkle/releases/latest/download/sparkle-${version.replace('v', '')}-setup.exe`,
				'_blank'
			);
		} else {
			window.open(
				`https://github.com/Parcoil/Sparkle/releases/latest/download/sparkle-${version.replace('v', '')}-win.zip`,
				'_blank'
			);
		}
	}

	return (
		<div className="flex min-h-[calc(100vh-3.3rem)] flex-col items-center justify-center p-8">
			<div className="flex w-full max-w-2xl flex-col items-center justify-center">
				<img
					src="/sparklelogo.png"
					alt="Sparkle Logo"
					className="mb-6 h-24 w-24 animate-bounce duration-900"
				/>
				<h1 className="mb-4 text-4xl font-bold">Oops!</h1>
				<p className="mb-6 text-lg text-muted-foreground">
					We couldn't find the page you were looking for.
				</p>
				<div className="mb-6 flex space-x-2">
					<Button asChild variant="default" size="lg">
						<Link href="/">Go Home</Link>
					</Button>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" size="lg">
								Download Sparkle
								<ChevronDown className="ml-2 h-4 w-4 opacity-50" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent className="w-56" align="start">
							<DropdownMenuGroup>
								<DropdownMenuItem onClick={() => handleDownload('exe')}>
									<Download className="mr-2 h-4 w-4" />
									<span>Installer (.exe)</span>
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => handleDownload('zip')}>
									<Download className="mr-2 h-4 w-4" />
									<span>Portable (.zip)</span>
								</DropdownMenuItem>
							</DropdownMenuGroup>
						</DropdownMenuContent>
					</DropdownMenu>
					<Button asChild variant="outline" size="lg">
						<a href="/docs">
							<ExternalLink className="mr-2 h-4 w-4" />
							Visit Docs
						</a>
					</Button>
				</div>
			</div>
			<Footer />
		</div>
	);
}
