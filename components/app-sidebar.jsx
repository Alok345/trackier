"use client"

import * as React from "react"
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  Settings2Icon,
  SquareTerminal,
  User,
  Users,
} from "lucide-react"

import { useState, useEffect } from "react"
import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

export function AppSidebar(props) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")

  useEffect(() => {
    const storedName = localStorage.getItem("name")
    const storedEmail = localStorage.getItem("email")

    if (storedName) setName(storedName)
    if (storedEmail) setEmail(storedEmail)
  }, [])

  // Move data *inside* component so it updates when state changes
  const data = {
    user: {
      name: name,
      email: email,
      avatar: "/avatars/shadcn.jpg",
    },
    teams: [
      {
        name: "Acme Inc",
        logo: GalleryVerticalEnd,
        plan: "Enterprise",
      },
      {
        name: "Acme Corp.",
        logo: AudioWaveform,
        plan: "Startup",
      },
      {
        name: "Evil Corp.",
        logo: Command,
        plan: "Free",
      },
    ],
    navProjects: [
      {
        name: "Dashboard",
        url: "/dashboard",
        icon: BookOpen,
      }
    ],
    navMain: [
      
      {
        title: "Team Management",
        url: "#",
        icon: User,
        items: [
          { title: "Add Member", url: "/add-member" },
          { title: "View Members", url: "/view-member" },
        ],
      },
      {
        title: "Campaigns",
        url: "#",
        icon: SquareTerminal,
        isActive: true,
        items: [
          { title: "Create Campaign", url: "/create-campaign" },
          { title: "Create Publisher", url: "/create-publisher" },
          { title: "Create Campaign Link", url: "/campaign-link" },
          { title: "Access Campaign", url: "/access-campaign" },
          { title: "Affiliate Links", url: "/affiliate-links" },
          { title: "Manage Campaign", url: "/manage-campaign" },
        ],
      },
      {
        title: "Reports",
        url: "#",
        icon: Bot,
        items: [
          { title: "Campaign Reports", url: "#" },
          { title: "Click Reports", url: "#" },
          { title: "Conversion Reports", url: "#" },
           { title: "Daily Reports", url: "#" },
          { title: "Domain/Publisher Reports", url: "#" },
          { title: "Impression Reports", url: "#" },
        ],
      },
      {
        title: "Publishers",
        url: "#",
        icon: Users,
        items: [
          { title: "Post Back", url: "#" },
          { title: "Pixels Settings", url: "#" },
         
        ],
      },
      {
        title: "Setting",
        url: "#",
        icon: Settings2,
        items: [
          { title: "Anti-fraud Tools", url: "#" },
          { title: "Data Imports", url: "#" },
          { title: "Smart Links", url: "#" },
         
        ],
      },
      
    ],
    // projects: [
    //   { name: "Design Engineering", url: "#", icon: Frame },
    //   { name: "Sales & Marketing", url: "#", icon: PieChart },
    //   { name: "Travel", url: "#", icon: Map },
    // ],
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        {/* <TeamSwitcher teams={data.teams} /> */}
        <h1 className="text-lg font-semibold text-center">Ad2Click</h1>

      </SidebarHeader>
      <SidebarContent>
      <NavProjects projects={data.navProjects} />

      <NavMain items={data.navMain} />
        
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
