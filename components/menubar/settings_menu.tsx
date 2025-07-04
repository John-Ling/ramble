import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { Settings } from "lucide-react"

import { LogOut } from "lucide-react"

export default function SettingsMenu() {
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="size-8">
          <Settings />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Entries</DropdownMenuItem>
          <DropdownMenuItem>Preferences</DropdownMenuItem>
          <DropdownMenuItem><LogOut /> Log Out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}