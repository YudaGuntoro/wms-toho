import React from "react";
import {
  BoxCubeIcon,
  BoltIcon,
  GridIcon,
} from "../icons/index";

export type NavSubItem = {
  name: string;
  path: string;
  pro?: boolean;
  new?: boolean;
};

export type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: NavSubItem[];
};

export const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    path: "/",
  },
  {
    icon: <BoltIcon />,
    name: "Warehouse Operations",
    subItems: [
      { name: "Stock In", path: "/stock-in" },
      { name: "Stock Out", path: "/stock-out" },
      { name: "Item Check", path: "/item-check" },
    ],
  },
  {
    icon: <BoxCubeIcon />,
    name: "Master Data",
    subItems: [
      { name: "Parts", path: "/parts" },
      { name: "Locations", path: "/locations" },
      { name: "Staff Cards", path: "/pic-cards" },
    ],
  },
];
