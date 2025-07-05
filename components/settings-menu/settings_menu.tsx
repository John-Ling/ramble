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

interface SettingsMenuProps {
  onEntries?: () => void;
  onPrefs?: () => void;
  onLogout?: () => void;
}

export default function SettingsMenu({onEntries = undefined, onPrefs = undefined, onLogout = undefined}: SettingsMenuProps) {
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="size-8">
          <Settings />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem disabled={!onEntries} onClick={onEntries}>Entries</DropdownMenuItem>
          <DropdownMenuItem disabled={!onPrefs} onClick={onPrefs}>Preferences</DropdownMenuItem>
          <DropdownMenuItem disabled={!onLogout} onClick={onLogout}><LogOut /> Log Out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}