"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Download,
  Shield,
  Github,
  Network,
  ChevronDown,
  Star,
  Zap,
  Copy,
  Trash2,
  Package,
  Wrench,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import Script from "next/script";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { CodeTabs } from "@/components/code-tabs";
import ReactLenis from "lenis/react";

const faqs = [
  {
    question: "Is Sparkle safe to use?",
    answer:
      "Yes! Sparkle only makes reversible changes. You can create system restore points before applying any tweaks.",
  },
  {
    question: "Which versions of Windows are supported?",
    answer: "Sparkle supports Windows 10 and 11.",
  },
  {
    question: "Can I undo changes made by Sparkle?",
    answer:
      "Yes, all tweaks are reversible. You can either use Sparkle's built-in restore option or a system restore point.",
  },
  {
    question: "Do I need an internet connection to use Sparkle?",
    answer:
      "The auto-updates require an internet connection. Most other features should work offline.",
  },
  {
    question: "How often is Sparkle updated?",
    answer:
      "Sparkle is actively maintained, with new features, versions and bug fixes released regularly. Check GitHub or here for the latest version.",
  },
  {
    question: "What should I do if I encounter an error?",
    answer:
      "Visit our GitHub Issues page to report bugs or join our Discord server for support.",
  },
  {
    question: "Why does Sparkle ask for admin permissions?",
    answer:
      "Admin permissions are required to apply system-level tweaks and optimizations and using/creating restore points.",
  },
  {
    question: "Why am i forced to update sparkle each time i open it?",
    answer:
      "Sparkle automatically checks for updates on launch. If an update is available, it will prompt you to update before continuing. The reason for this is microsoft is changeing windows rapidly and some tweaks may stop working or cause issues if not updated. By enforcing updates, we can ensure users have the best experience and avoid potential bugs from outdated versions.",
  },
  {
    question: "Why am i seeing ads on the website?",
    answer:
      "To keep Sparkle free and open-source, we rely on ad revenue to cover hosting and development costs. We use non-intrusive ads that do not affect your experience on the site. If you find the ads disruptive, consider supporting us on GitHub or sharing Sparkle with friends!",
  },
];

const features = [
  {
    title: "Debloat Windows",
    description:
      "Removes unnecessary Windows features and apps to free up resources and improve performance.",
    icon: Star,
    iconColor: "text-teal-500",
    categories: ["Performance", "Privacy"],
  },
  {
    title: "System Optimization",
    description:
      "Enhance system performance and responsiveness with carefully selected tweaks.",
    icon: Zap,
    iconColor: "text-pink-500",
    categories: ["Performance"],
  },
  {
    title: "Clean Temporary Files",
    description:
      "Remove temporary files, caches, and logs to free up valuable disk space.",
    icon: Trash2,
    iconColor: "text-yellow-500",
    categories: ["Maintenance"],
  },
  {
    title: "Safe & Reversible",
    description:
      "All changes can be easily undone with system restore points or by reverting settings.",
    icon: Shield,
    iconColor: "text-red-500",
    categories: ["Security"],
  },
  {
    title: "App Installer",
    description:
      "Quickly install your favorite applications using winget or chocolatey without leaving Sparkle.",
    icon: Package,
    iconColor: "text-blue-500",
    categories: ["Productivity"],
  },
  {
    title: "System Utilities",
    description:
      "Run essential system tools like SFC, Check Disk, and DISM from a simple, intuitive interface.",
    icon: Wrench,
    iconColor: "text-green-500",
    categories: ["Maintenance"],
  },
  {
    title: "Network Optimizer",
    description:
      "Optimize your network settings and change DNS for improved speed and security.",
    icon: Network,
    iconColor: "text-purple-500",
    categories: ["Performance", "Networking"],
  },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 20,
    },
  },
};

export default function Home() {
  const [version, setVersion] = useState("");
  const [downloads, setDownloads] = useState("");
  const [showMovedAlert, setShowMovedAlert] = useState(false);
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null);
  const [logoKey, setLogoKey] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setSearchParams(params);
      if (params.get("ref") === "parcoil-sparkle-page") {
        setShowMovedAlert(true);
      }
      fetchVersion();
      fetchDownloads();
    }
  }, []);

  function handleDownload(type: "exe" | "zip") {
    if (typeof window !== "undefined") {
      if (type === "exe") {
        window.open(
          `https://github.com/Parcoil/Sparkle/releases/latest/download/sparkle-${version.replace("v", "")}-setup.exe`,
          "_blank"
        );
      } else {
        window.open(
          `https://github.com/Parcoil/Sparkle/releases/latest/download/sparkle-${version.replace("v", "")}-win.zip`,
          "_blank"
        );
      }
    }
  }

  function fetchVersion() {
    fetch("https://api.github.com/repos/parcoil/sparkle/releases/latest")
      .then((res) => res.json())
      .then((data) => {
        setVersion(data.tag_name);
      });
  }

  async function fetchDownloads() {
    const releases = await (
      await fetch("https://api.github.com/repos/parcoil/sparkle/releases")
    ).json();
    let totalDownloads = 0;
    releases.forEach((release: any) => {
      const version = release.tag_name;
      if (version && version >= "2.0.0") {
        release.assets.forEach((asset: any) => {
          if (asset.name.endsWith(".exe") || asset.name.endsWith(".zip")) {
            totalDownloads += asset.download_count || 0;
          }
        });
      }
    });
    setDownloads(totalDownloads.toLocaleString("en-US"));
  }

  const copyCommand = () => {
    const command = "irm https://getsparkle.net/get | iex";
    navigator.clipboard.writeText(command);
    toast.success("Copied to clipboard");
  };

  const replayLogoAnimation = () => {
    setLogoKey((prev) => prev + 1);
  };

  const installMethods = [
    {
      label: "PowerShell",
      value: "powershell",
      code: "irm https://getsparkle.net/get | iex",
    },
    {
      label: "Chocolatey",
      value: "chocolatey",
      code: "choco install sparkle --version=2.13.0",
    },
  ];

  return (
    <>
      <Script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1565760898646999"
        crossOrigin="anonymous"
        strategy="beforeInteractive"
      />
      <ReactLenis root />
      <div className="mt-10 flex min-h-screen flex-col items-center justify-center px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex w-full max-w-5xl flex-col items-center justify-center">
          {searchParams?.get("ref") === "parcoil-sparkle-page" && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 mb-6 w-full max-w-md"
            >
              <Alert className="text-center">
                <AlertTitle>
                  Hello Parcoil user, Sparkle has moved to getsparkle.net
                </AlertTitle>
              </Alert>
            </motion.div>
          )}
          <motion.img
            key={logoKey}
            initial={{ opacity: 0, scale: 0.5, rotate: -180 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{
              duration: 0.5,
              type: "spring",
              stiffness: 200,
              damping: 20,
            }}
            whileHover={{ scale: 1.1, rotate: 5 }}
            onClick={replayLogoAnimation}
            src="/sparklelogo.png"
            alt="Sparkle Logo"
            className="mb-6 h-20 w-20 sm:h-24 sm:w-24 cursor-pointer"
          />

          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="m-mt-15 mb-4"
          >
            <motion.h1
              variants={fadeInUp}
              transition={{ duration: 0.35 }}
              className="mb-4 text-center text-4xl font-medium sm:text-5xl md:text-7xl"
            >
              Take control of your PC.
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              transition={{ duration: 0.35, delay: 0.06 }}
              className="text-center text-base text-muted-foreground sm:text-lg"
            >
              Open-Source tool to optimize Windows and boost gaming performance
              <br />
              and enhance privacy.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="mb-6 flex flex-col items-center space-y-2 text-center sm:flex-row sm:space-y-0 sm:space-x-8 sm:text-left"
          >
            <motion.div
              variants={fadeInUp}
              className="flex items-center space-x-2"
            >
              <p className="text-sm font-medium text-muted-foreground">
                Latest Version{" "}
                <motion.span
                  key={version}
                  initial={{ opacity: 0, scale: 0.5, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="font-semibold text-primary"
                >
                  {version || "..."}
                </motion.span>
              </p>
            </motion.div>
            <motion.div
              variants={fadeInUp}
              className="flex items-center space-x-2"
            >
              <p className="text-sm font-medium text-muted-foreground">
                Downloads{" "}
                <motion.span
                  key={downloads}
                  initial={{ opacity: 0, scale: 0.5, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                    delay: 0.06,
                  }}
                  className="font-semibold text-primary"
                >
                  {downloads || "..."}
                </motion.span>
              </p>
            </motion.div>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="hidden w-full flex-col justify-center space-y-2 sm:flex sm:w-auto sm:flex-row sm:space-y-0 sm:space-x-4"
          >
            <motion.div
              variants={fadeInUp}
              transition={{ duration: 0.3, delay: 0.12 }}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="w-full justify-center sm:w-auto">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full sm:w-56" align="start">
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => handleDownload("exe")}>
                      <Download className="mr-2 h-4 w-4" />
                      <span>Installer (.exe)</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDownload("zip")}>
                      <Download className="mr-2 h-4 w-4" />
                      <span>Portable (.zip)</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.18 }}
            className="mt-4 flex flex-col items-center justify-center space-y-2 px-4 text-center sm:hidden"
          >
            <p className="text-sm font-semibold text-primary">
              Please visit this page on a Windows PC to download Sparkle
            </p>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.24 }}
            className="mt-4 text-sm text-muted-foreground select-none"
          >
            CLI Install:
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <CodeTabs tabs={installMethods} className="w-sm gap-0 mt-4 z-40!" />
          </motion.div>

          <div className="relative w-full max-w-5xl flex flex-col items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.36 }}
              className="absolute inset-0 dark:bg-accent/20 bg-primary/30 blur-3xl rounded-full -z-10"
            ></motion.div>
            <motion.img
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.42 }}
              whileHover={{ scale: 1.05 }}
              src="/showcase.png"
              alt="Sparkle Screenshot"
              className="mt-6 aspect-video w-full max-w-full rounded-md border-2 border-primary transition-all duration-300 sm:max-w-200 dark:border-accent relative z-10"
            />
          </div>

          <div className="w-full py-12">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={fadeInUp}
                transition={{ duration: 0.35 }}
                className="text-center"
              >
                <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Features
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
                  Powerful Tweaks to optimize your Windows experience
                </p>
              </motion.div>

              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={staggerContainer}
                className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
              >
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    variants={fadeInUp}
                    transition={{ duration: 0.3, delay: index * 0.06 }}
                  >
                    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:ring-1 hover:ring-primary/20">
                      <CardHeader>
                        <motion.div
                          whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                          transition={{ duration: 0.3 }}
                          className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/40 text-primary"
                        >
                          <feature.icon
                            className={`h-6 w-6 ${feature.iconColor}`}
                          />
                        </motion.div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg font-semibold">
                            {feature.title}
                          </CardTitle>
                        </div>
                        <CardDescription className="mt-2 text-muted-foreground">
                          {feature.description}
                        </CardDescription>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {feature.categories.map((category, catIndex) => (
                            <motion.span
                              key={category}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{
                                delay: 0.36 + index * 0.06 + catIndex * 0.03,
                              }}
                              className="inline-flex items-center rounded-full bg-accent/50 px-2.5 py-0.5 text-xs font-medium text-accent-foreground"
                            >
                              {category}
                            </motion.span>
                          ))}
                        </div>
                      </CardHeader>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            <ins
              className="adsbygoogle"
              style={{ display: "block" }}
              data-ad-client="ca-pub-1565760898646999"
              data-ad-slot="3836598101"
              data-ad-format="auto"
              data-full-width-responsive="true"
            ></ins>
            <Script
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: "(adsbygoogle = window.adsbygoogle || []).push({});",
              }}
            />

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={fadeInUp}
                transition={{ duration: 0.35 }}
                className="text-center"
              >
                <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
                  FAQs
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
                  Frequently Asked Questions
                </p>
              </motion.div>

              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={staggerContainer}
              >
                <Accordion type="single" className="mt-6 space-y-2" collapsible>
                  {faqs.map((faq, index) => (
                    <motion.div
                      key={faq.question}
                      variants={fadeInUp}
                      transition={{ duration: 0.25, delay: index * 0.03 }}
                    >
                      <AccordionItem value={faq.question}>
                        <AccordionTrigger>{faq.question}</AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    </motion.div>
                  ))}
                </Accordion>
              </motion.div>
            </div>

            <ins
              className="adsbygoogle"
              style={{ display: "block" }}
              data-ad-client="ca-pub-1565760898646999"
              data-ad-slot="3836598101"
              data-ad-format="auto"
              data-full-width-responsive="true"
            ></ins>
            <Script
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: "(adsbygoogle = window.adsbygoogle || []).push({});",
              }}
            />

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              className="mt-12 w-full rounded-2xl bg-muted py-12 dark:border dark:border-accent dark:bg-muted/20"
            >
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <motion.div variants={staggerContainer} className="text-center">
                  <motion.h2
                    variants={fadeInUp}
                    className="text-2xl font-bold tracking-tight text-foreground sm:text-4xl"
                  >
                    App Gallery
                  </motion.h2>
                  <motion.p
                    variants={fadeInUp}
                    className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg"
                  >
                    Install apps quickly with Sparkle to make your Windows
                    experience better
                  </motion.p>
                  <motion.div variants={fadeInUp}>
                    <Button
                      asChild
                      className="mt-6 inline-flex w-full items-center justify-center px-6 py-3 sm:w-auto"
                    >
                      <a href="/apps">
                        Browse Apps{" "}
                        <ArrowRight className="-mr-1 ml-2 h-5 w-5" />
                      </a>
                    </Button>
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>

            <ins
              className="adsbygoogle"
              style={{ display: "block" }}
              data-ad-client="ca-pub-1565760898646999"
              data-ad-slot="3836598101"
              data-ad-format="auto"
              data-full-width-responsive="true"
            ></ins>
            <Script
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: "(adsbygoogle = window.adsbygoogle || []).push({});",
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
