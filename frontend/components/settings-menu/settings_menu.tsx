import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Settings } from "lucide-react"
import { LogOut } from "lucide-react"

interface SettingsMenuProps {
  on_entries?: () => void;
  on_prefs?: () => void;
  on_logout?: () => void;
  on_dashboard?: () => void;
  disabled: boolean;
}

export default function SettingsMenu({on_entries = undefined, on_prefs = undefined, on_logout = undefined, on_dashboard = undefined, disabled}: SettingsMenuProps) {
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="size-8 hover:text-gray-300" disabled={disabled} aria-disabled={disabled}>
          <Settings />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem disabled={!on_entries} onClick={on_entries}>Select Entry</DropdownMenuItem>
          <DropdownMenuItem disabled={!on_dashboard} onClick={on_dashboard}>Dashboard</DropdownMenuItem>
          <DropdownMenuItem disabled={!on_prefs} onClick={on_prefs}>Preferences</DropdownMenuItem>
          <DropdownMenuItem disabled={!on_logout} onClick={on_logout}><LogOut /> Log Out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}