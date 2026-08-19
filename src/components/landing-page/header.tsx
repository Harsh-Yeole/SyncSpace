'use client';

import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import Logo from "../../../public/syncspacelogo.svg";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

// const routes = [
//   { title: "Features", href: "#features" },
//   { title: "Reasources", href: "#resources" },
//   { title: "Pricing", href: "#pricing" },
//   { title: "Testimonials", href: "#testimonial" },
// ];

const components: { title: string; href: string; description: string }[] = [
  {
    title: "Alert Dialog",
    href: "#",
    description:
      "A modal dialog that interrupts the user with important content and expects a response.",
  },
  {
    title: "Hover Card",
    href: "#",
    description:
      "For sighted users to preview content available behind a link.",
  },
  {
    title: "Progress",
    href: "#",
    description:
      "Displays an indicator showing the completion progress of a task, typically displayed as a progress bar.",
  },
  {
    title: "Scroll-area",
    href: "#",
    description: "Visually or semantically separates content.",
  },
  {
    title: "Tabs",
    href: "#",
    description:
      "A set of layered sections of contentâ€”known as tab panelsâ€”that are displayed one at a time.",
  },
  {
    title: "Tooltip",
    href: "#",
    description:
      "A popup that displays information related to an element when the element receives keyboard focus or the mouse hovers over it.",
  },
];

const Header = () => {
  const [path, setPath] = useState("#products");
  return (
    <header
      className="p-4
    flex
    justify-center
    items-center"
    >
      <Link
        href={"/"}
        className="w-full flex flex-col gap-1
        justify-left items-left"
      >
        <Image src={Logo} alt="Logo" width={30} height={30} className="ml-1" />
        <span
          className="font-semibold
        dark:text-white
        ml-1"
        >
          syncspace.
        </span>
      </Link>
      <NavigationMenu className="hidden md:block ">
        <NavigationMenuList className="gap-6">
          <NavigationMenuItem>
            <NavigationMenuTrigger
              onClick={() => setPath("#resources")}
              className={cn({
                "dark:text-white": path === "#resources",
                "dark:text-white/40": path !== "#resources",
                "font-normal": true,
                "text-xl": true,
              })}
            >
              Resources
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul
                className="grid
                gap-3
                p-6
                md:w-[400px]
                ld:w-[500px]
               lg:grid-cols-[.75fr_1fr]"
              >
                <li className="row-span-3">
                  <span
                    className="flex h-full w-full select-none
                  flex-col
                 justify-end
                  rounded-md
                  bg-gradient-to-b
                  from-muted/50
                  to-muted
                  p-6 no-underline
                  outline-none
                  focus:shadow-md"
                  >
                    Welcome
                  </span>
                </li>
                <ListItems href="#" title="Introduction">
                  Re-usable components built using Radix UI and Tailwind CSS.
                </ListItems>
                <ListItems href="#" title="Installation">
                  How to install dependencies and structure your app.
                </ListItems>
                <ListItems href="#" title="Typography">
                  Styles for headings, paragraphs, lists...etc
                </ListItems>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuTrigger
              onClick={() => setPath("#pricing")}
              className={cn({
                "dark:text-white": path === "#pricing",
                "dark:text-white/40": path !== "#pricing",
                "font-normal": true,
                "text-xl": true,
              })}
            >
              Pricing
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul
                className="grid
                gap-3
                p-4
                w-[400px]
                md:grid-row-2"
              >
                <ListItems title="Pro Plan" href={"#"}>
                  Unlock full power with collaboration.
                </ListItems>
                <ListItems title={"free Plan"} href={"#"}>
                  Great for teams just starting out.
                </ListItems>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuTrigger
              onClick={() => setPath("#features")}
              className={cn({
                "dark:text-white": path === "#features",
                "dark:text-white/40": path !== "#features",
                "font-normal": true,
                "text-xl": true,
              })}
            >
              Features
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul
                className="grid
                w-[400px]
                gap-3
                p-4
                md:w-[500px]
                md:grid-cols-2
                lg:w-[600px]"
              >
                {components.map((component) => (
                  <ListItems
                    key={component.title}
                    title={component.title}
                    href={component.href}
                  >
                    {component.description}
                  </ListItems>
                ))}
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <Link
                href={"#"}
                className={cn(navigationMenuTriggerStyle(), {
                  "dark:text-white": path === "#testimonials",
                  "dark:text-white/40": path !== "#testimonials",
                  "font-normal": true,
                  "text-xl": true,
                })}
              >
                Testimonials
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      <aside
        className="flex
      w-full
      gap-2
      justify-end"
      >
        <Link href={"/login"}>
          <div
            style={{ backgroundColor: "#212124" }}
            className="p-[1px] rounded-[6px] w-[100px] 
            bg-gradient-to-r 
            from-primary-purple-300 to-primary-blue-100"
          >
            <Button
              variant="outline"
              className="px-7 w-full hover:bg-black/85 
              transition-all duration-200 ease-in-out "
            >
              Login
            </Button>
          </div>
        </Link>
        <Link href={"/signup"}>
          <div
            className="p-[1.5px] rounded-[6px] 
            hidden sm:block
          bg-white/40"
          >
            <Button
              variant="default"
              className="px-7
              bg-white/95 hover:bg-white/80 
              transition-all duration-200 ease-in-out "
            >
              Sign Up
            </Button>
          </div>
        </Link>
      </aside>
    </header>
  );
};

export default Header;

const ListItems = React.forwardRef<
  React.ComponentRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "group block select-none space-y-1 font-medium leading-none"
          )}
          {...props}
        >
          <div
            className="text-white
                    text-sm 
                    font-medium
                    leading-none"
          >
            {title}
          </div>
          <p
            className="group-hover:text-white/70
          line-clamp-2
          text-sm
          leading-snug
          text-white/40"
          >
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
});

ListItems.displayName = "ListItems";
