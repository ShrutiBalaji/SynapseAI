import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProvider } from "./context/AppContext";
import { NotificationProvider } from "./context/NotificationContext";
import { SidebarProvider } from "./components/SidebarProvider";
import SidebarToggle from "./components/SidebarToggle";
import SidebarWrapper from "./components/SidebarWrapper";
import Link from "next/link";
import Image from "next/image";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Synapse",
	description: "ChatGPT × Linear × Obsidian — collaborative problem solving",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0b0b0f] text-[#e6e6f0]`}> 
				<AppProvider>
					<NotificationProvider>
						<SidebarProvider>
							<div className="grid grid-rows-[56px_1fr] h-dvh">
								<header className="flex items-center justify-between border-b border-white/10 px-4 bg-[#0f1117]">
									<div className="flex items-center gap-3">
										<SidebarToggle />
										<Link href="/" className="flex items-center gap-2 font-semibold text-[#9ecbff] hover:text-white">
											<Image src="/logo.svg" alt="Synapse" width={24} height={24} />
											<span>Synapse</span>
										</Link>
										<nav className="ml-6 hidden md:flex items-center gap-4 text-sm">
											<Link href="/problems" className="hover:text-white text-[#cbd5e1]">Problems</Link>
											<Link href="/graph" className="hover:text-white text-[#cbd5e1]">Graph</Link>
										</nav>
									</div>
								</header>
								<div className="flex h-full overflow-hidden">
									<SidebarWrapper />
									<main className="flex-1 min-w-0 overflow-hidden">
										{children}
									</main>
								</div>
							</div>
						</SidebarProvider>
					</NotificationProvider>
				</AppProvider>
			</body>
		</html>
	);
}
