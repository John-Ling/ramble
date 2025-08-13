import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { Settings } from "lucide-react"

import { LogOut } from "lucide-react"

interface SettingsMenuProps {
  onEntries?: () => void;
  onPrefs?: () => void;
  onLogout?: () => void;
  disabled: boolean;
}

export default function SettingsMenu({onEntries = undefined, onPrefs = undefined, onLogout = undefined, disabled}: SettingsMenuProps) {
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="size-8 hover:text-gray-300" disabled={disabled} aria-disabled={disabled}>
          <Settings />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem disabled={!onEntries} onClick={onEntries}>Select Entry</DropdownMenuItem>
          <DropdownMenuItem disabled={true}>Account</DropdownMenuItem>
          <DropdownMenuItem disabled={true}>Conversation Mode</DropdownMenuItem>
          <DropdownMenuItem disabled={!onPrefs} onClick={onPrefs}>Preferences</DropdownMenuItem>
          <DropdownMenuItem disabled={!onLogout} onClick={onLogout}><LogOut /> Log Out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}